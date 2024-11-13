import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequestCustom } from 'src/common/interfaces/request-custom';
import { User } from '../../entities/user.entity';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { DepositUserDto } from './dto/deposit-user.dto';
import { TransferUserDto } from './dto/transfer-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.', type: User })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Post('transfer')
  transfer(@Body() transferUserDto: TransferUserDto, @Req() req: RequestCustom) {
    const userId = req.user.sub;
    return this.userService.transfer(transferUserDto, userId);
  }

  @UseGuards(AuthGuard)
  @Post('deposit')
  deposit(@Body() depostUserDto: DepositUserDto, @Req() req: RequestCustom) {
    const userId = req.user.sub;
    return this.userService.deposit(depostUserDto, userId);
  }
}
