import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, UpdateResult } from 'typeorm';

import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';

import { Wish } from './entities/wish.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
  ) {}

  async updateRise(id: number, newRise: number): Promise<UpdateResult> {
    return await this.wishRepository.update({ id: id }, { raised: newRise });
  }

  async create(owner: User, createWishDto: CreateWishDto) {
    return await this.wishRepository.save({
      ...createWishDto,
      owner: owner,
    });
  }

  async getLastWishes(): Promise<Wish[]> {
    return await this.wishRepository.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getTopWishes(): Promise<Wish[]> {
    return await this.wishRepository.find({
      order: { copied: 'DESC' },
      where: { copied: MoreThan(0) },
      take: 10,
    });
  }

  async findOne(wishId: number): Promise<Wish> {
    return await this.wishRepository.findOne({
      where: { id: wishId },
      relations: {
        owner: {
          wishes: true,
          wishlists: true,
        },
        offers: {
          user: true,
          item: true,
        },
      },
    });
  }

  async updateOne(wishId: number, updateWish: UpdateWishDto, userId: number) {
    const wish = await this.findOne(wishId);

    if (wish.owner.id === userId) {
      throw new ForbiddenException('Нельзя редактировать чужие подарки');
    }

    if (wish.raised > 0 && wish.price !== undefined) {
      throw new ForbiddenException(
        'Нельзя редактировать подарки, на которые собираются деньги',
      );
    }
    return await this.wishRepository.update(wishId, updateWish);
  }

  async remove(wishId: number, userId: number) {
    const wish = await this.findOne(wishId);

    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужие подарки');
    }

    if (wish.raised > 0 && wish.price !== undefined) {
      throw new ForbiddenException(
        'Нельзя удалять подарки, на которые уже собраны деньги',
      );
    }
    await this.wishRepository.delete(wishId);
    return wish;
  }

  async findMany(items: number[]): Promise<Wish[]> {
    return this.wishRepository.findBy({ id: In(items) });
  }

  async copyWish(wishId: number, user: User) {
    const wish = await this.findOne(wishId);

    if (user.id === wish.owner.id) {
      throw new ForbiddenException('Нельзя копировать имеющиеся подарки');
    }

    await this.wishRepository.update(wishId, {
      copied: wish.copied + 1,
    });
    const wishCopy = {
      ...wish,
      owner: user.id,
      raised: 0,
      offers: [],
    };
    await this.create(user, wishCopy);
    return {};
  }
}
