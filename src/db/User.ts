import { encrypt } from 'src/helpers/encryption';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar', {
    unique: false,
    nullable: true,
  })
  username!: string | null;

  @Column('varchar', {
    nullable: true,
    unique: true,
    transformer: encrypt,
  })
  email!: string | null;

  @Column('varchar', {
    unique: false,
    nullable: true,
    transformer: encrypt,
  })
  password!: string | null;

  @Column('varchar', {
    unique: true,
    nullable: true,
  })
  googleID!: string | null;

  @Column('varchar', {
    default: 0,
    unique: false,
    nullable: true,
  })
  role!: number | null;
}
