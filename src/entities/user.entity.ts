import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Session } from './session.entity';

@Entity({ name: 'users', schema: 'public' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column('decimal', { default: 0 })
  balance: number;

  @OneToMany(() => Session, (session) => session.user, { cascade: true })
  sessions: Session[]

  @Column({ nullable: true, name: 'updated_at' })
  updatedAt: Date | null;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @BeforeInsert()
  addCreatedAt() {
    this.createdAt = new Date()
  }

  @BeforeUpdate()
  addUpdatedAt() {
    this.updatedAt = new Date()
  }
}
