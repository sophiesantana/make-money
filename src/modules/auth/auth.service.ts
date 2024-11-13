import { HttpCode, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { SessionService } from '../session/session.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService
  ) { }

  @HttpCode(HttpStatus.CREATED)
  async register(createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
  }

  async login(createUserDto: CreateUserDto) {
    const user = await this.userService.findByUsername(createUserDto.username);

    if (!user) throw new UnauthorizedException();

    const passwordMatch = await compare(createUserDto.password, user?.password);

    if (!passwordMatch) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id }
    );

    const { refreshToken } = await this.sessionService.create(user.id);

    return {
      accessToken,
      refreshToken
    }
  }
}
