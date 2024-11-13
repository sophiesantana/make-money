import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../../../../entities/user.entity';
import { CreateUserDto } from '../../../user/dto/create-user.dto';
import { DepositUserDto } from '../../../user/dto/deposit-user.dto';
import { TransferUserDto } from '../../../user/dto/transfer-user.dto';
import { UserService } from '../../../user/user.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
    update: jest.fn(),
    getRepository: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        password: 'testpassword',
      };

      jest.spyOn(service, 'findByUsername').mockResolvedValue(null);

      const mockedHashedPassword = 'hashedpassword';
      (hash as jest.Mock).mockResolvedValue(mockedHashedPassword);

      const user = { ...createUserDto, password: mockedHashedPassword };
      mockUserRepository.create.mockReturnValue(user);
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);

      expect(service.findByUsername).toHaveBeenCalledWith(createUserDto.username);
      expect(hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({ ...createUserDto, password: mockedHashedPassword });
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'existinguser',
        password: 'password',
      };

      jest.spyOn(service, 'findByUsername').mockResolvedValue(new User());

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(service.findByUsername).toHaveBeenCalledWith(createUserDto.username);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should return user when user exists', async () => {
      const username = 'testuser';
      const user = new User();
      user.username = username;

      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByUsername(username);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { username } });
      expect(result).toEqual(user);
    });

    it('should return null when user does not exist', async () => {
      const username = 'nonexistentuser';

      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername(username);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { username } });
      expect(result).toBeNull();
    });
  });

  describe('transfer', () => {
    it('should transfer amount from owner to receiver successfully', async () => {
      const transferUserDto: TransferUserDto = { receiverId: 'receiver-id', amount: 100 };
      const ownerId = 'owner-id';
      const userOwner = { id: ownerId, balance: 200 } as User;
      const userReceiver = { id: transferUserDto.receiverId, balance: 50 } as User;

      mockUserRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest
              .fn()
              .mockResolvedValueOnce(userReceiver)
              .mockResolvedValueOnce(userOwner),
            update: jest.fn(),
          }),
        };
        return callback(manager);
      });

      const result = await service.transfer(transferUserDto, ownerId);

      expect(mockUserRepository.manager.transaction).toHaveBeenCalled();
      expect(result).toEqual('Transferencia realizada com sucesso.');
    });

    it('should throw BadRequestException if receiver does not exist', async () => {
      const transferUserDto: TransferUserDto = { receiverId: 'invalid-receiver-id', amount: 100 };
      const ownerId = 'owner-id';

      mockUserRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValueOnce(null),
          }),
        };
        return callback(manager);
      });

      await expect(service.transfer(transferUserDto, ownerId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if owner does not have enough balance', async () => {
      const transferUserDto: TransferUserDto = { receiverId: 'receiver-id', amount: 150 };
      const ownerId = 'owner-id';
      const userOwner = { id: ownerId, balance: 100 } as User;
      const userReceiver = { id: transferUserDto.receiverId, balance: 50 } as User;

      mockUserRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest
              .fn()
              .mockResolvedValueOnce(userReceiver)
              .mockResolvedValueOnce(userOwner),
          }),
        };
        return callback(manager);
      });

      await expect(service.transfer(transferUserDto, ownerId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deposit', () => {
    it('should deposit amount to owner successfully', async () => {
      const depositUserDto: DepositUserDto = { amount: 100 };
      const ownerId = 'owner-id';
      const userOwner = { id: ownerId, balance: 200 } as User;

      mockUserRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(userOwner),
            update: jest.fn(),
          }),
        };
        return callback(manager);
      });

      await service.deposit(depositUserDto, ownerId);

      expect(mockUserRepository.manager.transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if owner does not exist', async () => {
      const depositUserDto: DepositUserDto = { amount: 100 };
      const ownerId = 'invalid-owner-id';

      mockUserRepository.manager.transaction.mockImplementation(async (callback) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue({
            findOne: jest.fn().mockResolvedValue(null),
          }),
        };
        return callback(manager);
      });

      await expect(service.deposit(depositUserDto, ownerId)).rejects.toThrow(BadRequestException);
    });
  });
});
