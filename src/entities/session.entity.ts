import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'sessions', schema: 'public' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'refresh_token' })
  refreshToken: string;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt: Date | null;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User

  @Column({ nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  addCreatedAt() {
    this.createdAt = new Date()
  }

  @BeforeUpdate()
  addUpdatedAt() {
    this.updatedAt = new Date()
  }
}
