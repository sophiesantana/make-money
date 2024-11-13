import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { DepositUserDto } from './dto/deposit-user.dto';
import { TransferUserDto } from './dto/transfer-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto) {
    const userExists = await this.findByUsername(createUserDto.username);

    if (userExists) throw new ConflictException('Usuário já existe!');

    const passwordHash = await hash(createUserDto.password, 10);
    const user = this.userRepository.create({ ...createUserDto, password: passwordHash });

    const data = await this.userRepository.save(user);

    return data;
  }

  findAll() {
    return `This action returns all user`;
  }

  async findByUsername(username: string) {
    return await this.userRepository.findOne({
      where: {
        username
      }
    });
  }

  async transfer(data: TransferUserDto, ownerId: string) {
    return this.userRepository.manager.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      const userReceiver = await userRepository.findOne({
        where: {
          id: data.receiverId
        }
      });

      if (!userReceiver) throw new BadRequestException();

      const userOwner = await userRepository.findOne({
        where: {
          id: ownerId
        }
      })

      if (!userOwner) throw new BadRequestException();

      if (data.amount > userOwner.balance) throw new BadRequestException();

      await userRepository.update({
        id: userOwner.id,
      },
        {
          balance: userOwner.balance - data.amount
        }
      )

      await userRepository.update({
        id: userReceiver.id,
      },
        {
          balance: userReceiver.balance + data.amount
        }
      )

      return 'Transferencia realizada com sucesso.'
    });
  }

  async deposit(data: DepositUserDto, ownerId: string) {
    return this.userRepository.manager.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      const userOwner = await userRepository.findOne({
        where: {
          id: ownerId
        }
      })

      if (!userOwner) throw new BadRequestException();

      await userRepository.update({
        id: userOwner.id,
      },
        {
          balance: userOwner.balance + data.amount
        }
      )
    })
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
