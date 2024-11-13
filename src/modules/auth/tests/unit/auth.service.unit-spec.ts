import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { compare } from 'bcrypt';
import { User } from '../../../../entities/user.entity';
import { SessionService } from '../../../session/session.service';
import { CreateUserDto } from '../../../user/dto/create-user.dto';
import { UserService } from '../../../user/user.service';
import { AuthService } from '../../auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let sessionService: SessionService;

  const mockUserService = {
    create: jest.fn(),
    findByUsername: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockSessionService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    sessionService = module.get<SessionService>(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = { username: 'newuser', password: 'password' };
      mockUserService.create.mockResolvedValue(undefined);

      await service.register(createUserDto);

      expect(mockUserService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login successfully and return tokens', async () => {
      const createUserDto: CreateUserDto = { username: 'testuser', password: 'password' };
      const user = new User();
      user.id = 'user-id';
      user.username = 'testuser';
      user.password = 'hashedpassword';

      mockUserService.findByUsername.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('access-token');
      mockSessionService.create.mockResolvedValue({ refreshToken: 'refresh-token' });

      const result = await service.login(createUserDto);

      expect(mockUserService.findByUsername).toHaveBeenCalledWith(createUserDto.username);
      expect(compare).toHaveBeenCalledWith(createUserDto.password, user.password);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({ sub: user.id });
      expect(mockSessionService.create).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const createUserDto: CreateUserDto = { username: 'invaliduser', password: 'password' };

      mockUserService.findByUsername.mockResolvedValue(null);

      await expect(service.login(createUserDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(createUserDto.username);
      expect(compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const createUserDto: CreateUserDto = { username: 'testuser', password: 'wrongpassword' };
      const user = new User();
      user.id = 'user-id';
      user.username = 'testuser';
      user.password = 'hashedpassword';

      mockUserService.findByUsername.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(createUserDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(createUserDto.username);
      expect(compare).toHaveBeenCalledWith(createUserDto.password, user.password);
    });
  });
});
