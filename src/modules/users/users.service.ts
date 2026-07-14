import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(query: QueryUsersDto) {
    const { departmentId, teamId, role, page = 1, limit = 20 } = query;

    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.team', 'team')
      .leftJoinAndSelect('team.department', 'department')
      .where('user.isActive = :isActive', { isActive: true });

    if (departmentId) qb.andWhere('department.id = :departmentId', { departmentId });
    if (teamId) qb.andWhere('user.teamId = :teamId', { teamId });
    if (role) qb.andWhere('user.role = :role', { role });

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: data.map(this.sanitize), meta: { page, limit, total } };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: `User ${id} not found` });
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    await this.userRepository.update(id, dto);
    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.findById(id);
    await this.userRepository.update(id, { isActive: false });
  }

  private sanitize(user: User) {
    const { passwordHash, refreshTokenHash, ...rest } = user;
    return rest;
  }
}
