import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';

import { Offer } from './entities/offer.entity';
import { offersDependencies } from '../dependencies/offersDependencies';

@Module({
  imports: [TypeOrmModule.forFeature([Offer]), ...offersDependencies],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
