import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from './modules/database/database.module';

import { AuthModule } from './modules/auth/auth.module';
import { SessionModule } from './modules/session/session.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: process.env.JWT_EXPIRATION
      }
    }),
    DatabaseModule,
    UserModule,
    SessionModule,
    AuthModule
  ]
})
export class AppModule { }
