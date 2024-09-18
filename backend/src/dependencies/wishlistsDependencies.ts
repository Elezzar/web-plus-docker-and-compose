import { UsersModule } from '../users/users.module';
import { WishesModule } from '../wishes/wishes.module';

export const wishlistsDependencies = [UsersModule, WishesModule];
