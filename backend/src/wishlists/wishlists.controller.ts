import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

import { JwtGuard } from '../guards/jwt.guard';
import { Wishlist } from './entities/wishlist.entity';

interface Request {
  user?: any;
}

@UseGuards(JwtGuard)
@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @UseGuards(JwtGuard)
  @Post()
  async create(
    @Req() req: Request,
    @Body() createWishListDto: CreateWishlistDto,
  ): Promise<Wishlist> {
    try {
      return await this.wishlistsService.create(createWishListDto, req.user);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Произошла ошибка при создании списка желаний',
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get()
  async findAll(): Promise<Wishlist[]> {
    try {
      return await this.wishlistsService.findMany();
    } catch (error) {
      console.error(error);
      throw new NotFoundException(
        'Произошла ошибка при получении списка желаний',
      );
    }
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Wishlist> {
    try {
      return await this.wishlistsService.findOne(id);
    } catch (error) {
      console.log(error);
      throw new NotFoundException('Список желаний не найден');
    }
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  async updateOne(
    @Body() updateWishlistDto: UpdateWishlistDto,
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Wishlist> {
    try {
      return await this.wishlistsService.updateOne(
        req.user.id,
        updateWishlistDto,
        +id,
      );
    } catch (error) {
      console.error(error);
      throw new NotFoundException(
        'Произошла ошибка при обновлении списка желаний',
      );
    }
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: number,
  ): Promise<Wishlist> {
    try {
      return await this.wishlistsService.remove(id, req.user.id);
    } catch (error) {
      console.error(error);
      throw new NotFoundException(
        'Произошла ошибка при удалении списка желаний',
      );
    }
  }
}
