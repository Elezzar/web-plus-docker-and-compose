import { UsersModule } from '../users/users.module';
import { WishesModule } from '../wishes/wishes.module';

export const offersDependencies = [UsersModule, WishesModule];
