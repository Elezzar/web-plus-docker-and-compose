import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer } from './entities/offer.entity';
import { WishesService } from '../wishes/wishes.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly wishesService: WishesService,
  ) {}

  async create(createOfferDto: CreateOfferDto, user: User) {
    const wishes = await this.wishesService.findOne(createOfferDto.itemId);
    const wish = await this.wishesService.findOne(wishes.id);
    const result = wish.price - wish.raised;
    const rise = Number(wish.raised) + Number(createOfferDto.amount);

    if (wish.owner.id === user.id) {
      throw new ForbiddenException('Нельзя внести деньги на подарки себе');
    }

    if (createOfferDto.amount > wish.price) {
      throw new ForbiddenException('Cумма взноса превышает стоимость подарка');
    }

    if (createOfferDto.amount > result) {
      throw new ForbiddenException(
        'Сумма взноса превышает оставшуюся сумму сбора',
      );
    }

    if (wish.raised === wish.price) {
      throw new ForbiddenException('Необходимая сумма собрана');
    }

    await this.wishesService.updateRise(createOfferDto.itemId, rise);
    const offerDto = {
      ...createOfferDto,
      user: user,
      item: wish,
    };
    return await this.offerRepository.save(offerDto);
  }

  findAll(): Promise<Offer[]> {
    try {
      return this.offerRepository.find({
        relations: {
          item: {
            owner: true,
            offers: true,
          },
          user: {
            wishes: true,
            wishlists: true,
            offers: true,
          },
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  async findOne(id: number): Promise<Offer> {
    const offer = await this.offerRepository.findOneBy({ id });
    if (!offer) {
      throw new NotFoundException('Предложение не найдено');
    }
    return offer;
  }
}
