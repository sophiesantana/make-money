import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dayjs from 'dayjs';
import { Repository } from 'typeorm';

import { Session } from '../../entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) { }

  async create(userId: string) {
    const now = Date.now();
    const refreshToken = Buffer.from(`${now}-${userId}`).toString('hex');
    const expiresAt = dayjs().add(14, 'd').toDate();

    const session = this.sessionRepository.create({
      refreshToken,
      expiresAt,
      user: { id: userId }
    })

    await this.sessionRepository.save(session);

    return {
      refreshToken
    }
  }
}
