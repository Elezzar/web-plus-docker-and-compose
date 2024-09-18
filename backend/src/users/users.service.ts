import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { User } from './entities/user.entity';
import { ProviderHash } from '../utils/utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return await this.usersRepository.findOneBy({
      email,
    });
  }

  async findUserByName(username: string) {
    return await this.usersRepository.findOne({
      where: {
        username: username,
      },
    });
  }

  async create(CreateUserDto: CreateUserDto): Promise<User> {
    const username = await this.findUserByName(CreateUserDto.username);
    const email = await this.findByEmail(CreateUserDto.email);

    if (username !== null) {
      throw new ForbiddenException(
        'Пользователь с таким именем уже существует',
      );
    }

    if (email) {
      throw new ForbiddenException('Пользователь с таким email уже существует');
    }

    const user = this.usersRepository.create(CreateUserDto);
    user.password = await ProviderHash.createHash(user.password);
    return await this.usersRepository.save(user);
  }

  async findOne(id: number): Promise<User> {
    try {
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }
      return user;
    } catch (error) {
      console.error(error);
    }
  }

  async updateOne(id: number, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.password) {
        updateUserDto.password = await ProviderHash.createHash(
          updateUserDto.password,
        );
      }

      if (updateUserDto.username) {
        const username = await this.findUserByName(updateUserDto.username);
        if (username !== null && username.id !== id) {
          throw new ForbiddenException(
            'Пользователь с таким именем уже существует',
          );
        }
      }

      if (updateUserDto.email) {
        const email = await this.findByEmail(updateUserDto.email);
        if (email !== null && email.id !== id) {
          throw new ForbiddenException(
            'Пользователь с таким email уже существует',
          );
        }
      }
      await this.usersRepository.update({ id }, updateUserDto);
      const updatedUser = await this.findOne(id);
      return updatedUser;
    } catch (error) {
      console.error(error);
    }
  }

  async findUserByAllCredentials(username: string) {
    const user = await this.usersRepository.findOne({
      select: ['id', 'username', 'about', 'avatar', 'createdAt', 'updatedAt'],
      where: {
        username: username,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async checkJwt(id: number) {
    return await this.usersRepository.find({
      select: {
        id: true,
        username: true,
      },
      where: {
        id: id,
      },
    });
  }

  async findAllUsers(query: string) {
    return await this.usersRepository.find({
      where: [{ username: query }, { email: query }],
    });
  }

  async findMyWishes(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const wishes = await this.usersRepository.find({
      select: ['wishes'],
      relations: {
        wishes: {
          owner: true,
          offers: {
            user: {
              wishes: true,
              offers: true,
              wishlists: {
                owner: true,
                items: true,
              },
            },
          },
        },
      },
      where: {
        id: id,
      },
    });

    const arrayWishes = wishes.map((wish) => wish.wishes);
    return arrayWishes[0];
  }
}
