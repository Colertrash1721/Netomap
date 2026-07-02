import { Injectable } from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Response, Request } from 'express';
import { Drivers } from './entities/driver.entity';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class DriverService {

  constructor(
    @InjectRepository(Drivers) private readonly driverRepository: Repository<Drivers>,
    private readonly authService: AuthService,
  ) { }

  async create(createDriverDto: CreateDriverDto, req: Request) {
    const driver = this.driverRepository.create(createDriverDto);
    return this.driverRepository.save(driver);
  }

  findAll() {
    return this.driverRepository.find();
  }

  async findDriversByUserId(userId: number) {
    const drivers = await this.driverRepository.find({ where: { userId } });
    return drivers;
  }

  async getDriverById(driverId: number) {
    const driver = await this.driverRepository.findOne({ where: { id: driverId } });
    if (!driver) {
      throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);
    }
    return driver;
  }

  findOne(id: number) {
    return `This action returns a #${id} driver`;
  }

  update(id: number, updateDriverDto: UpdateDriverDto) {
    return `This action updates a #${id} driver`;
  }

  remove(id: number) {
    return `This action removes a #${id} driver`;
  }
}
