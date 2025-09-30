import { Entity, Column, PrimaryColumn, Index, BaseEntity } from 'typeorm';

@Entity('sessions')
export class Session extends BaseEntity {
  @Index()
  @Column('bigint')
  expiredAt!: number;

  @PrimaryColumn('varchar', { length: 255 })
  id!: string;

  @Column('text')
  json!: string;
}
