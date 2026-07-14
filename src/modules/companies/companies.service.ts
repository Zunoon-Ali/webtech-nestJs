import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, Department, Team } from '../../database/entities';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(Department) private deptRepo: Repository<Department>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
  ) {}

  async findCompany(id: string) {
    const co = await this.companyRepo.findOne({ where: { id }, relations: { departments: true } });
    if (!co) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: `Company ${id} not found` });
    return co;
  }

  // Departments
  async findDepartments(companyId: string) {
    return this.deptRepo.find({ where: { companyId } });
  }

  async createDepartment(companyId: string, name: string) {
    const dept = this.deptRepo.create({ companyId, name });
    return this.deptRepo.save(dept);
  }

  // Teams
  async findTeams(departmentId: string) {
    return this.teamRepo.find({ where: { departmentId } });
  }

  async createTeam(departmentId: string, name: string) {
    const team = this.teamRepo.create({ departmentId, name, managerId: null });
    return this.teamRepo.save(team);
  }

  async updateTeam(id: string, data: Partial<Team>) {
    const team = await this.teamRepo.findOne({ where: { id } });
    if (!team) throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: `Team ${id} not found` });
    Object.assign(team, data);
    return this.teamRepo.save(team);
  }

  async getTeamMembers(teamId: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: { members: true } });
    if (!team) throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: `Team ${teamId} not found` });
    return team.members;
  }
}
