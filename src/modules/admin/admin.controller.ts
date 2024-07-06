import {
  BadRequestException,
  Body,
  Request,
  Controller,
  Get,
  NotFoundException,
  Post,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UserService } from '../user/user.service';
import { SetRoleDto } from './admin.dto';
import { Role } from 'src/db/types';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { constants } from 'src/config/constants';

@ApiTags('admin')
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UserService,
  ) {}

  @Get('/getAllUsers')
  async getAllUsers() {
    try {
      const users = await this.adminService.getAllUsers();

      return users.map((user) => {
        return this.usersService.removePasswordFromUser(user);
      });
    } catch {
      return new NotFoundException();
    }
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/getUserStatistic')
  async getUserStatistic(@Request() req: any) {
    //check if user is moderator or adm
    //start
    const { id } = req.user;
    const foundUser = await this.usersService.getById(id);

    if (foundUser) {
      if (foundUser.role != Role.Admin && foundUser.role != Role.Moderator) {
        throw new HttpException(
          'You have no permission! It is only for website stuff!',
          HttpStatus.FORBIDDEN,
        );
      }
    }
    //end
    //check if user is moderator or adm

    try {
      const users = await this.adminService.getAllUsers();

      let onlineQuantity = 0;
      const newUsers = [];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const statistics = {}; // Object for collecting statistics

      users.forEach((user) => {
        const lastActiveDate = new Date(user.lastActiveAt);
        const createdDate = new Date(user.createdAt);

        // Check if user was online today
        if (
          lastActiveDate.getFullYear() === currentYear &&
          lastActiveDate.getMonth() === currentMonth &&
          lastActiveDate.getDate() === currentDate.getDate()
        ) {
          onlineQuantity++;
        }

        // Test if registered this month
        if (
          createdDate.getFullYear() === currentYear &&
          createdDate.getMonth() === currentMonth
        ) {
          newUsers.push(user);

          // Daily statistic
          const day = createdDate.getDate();
          const dayFormatted = `${String(day).padStart(2, '0')}.${String(currentMonth + 1).padStart(2, '0')}`; // Format to dd.mm
          if (!statistics[dayFormatted]) {
            statistics[dayFormatted] = 0;
          }
          statistics[dayFormatted]++;
        }
      });

      // Transfer object statistic to array
      const statisticsArray = Object.keys(statistics).map((day) => ({
        x: day,
        y: statistics[day],
      }));

      return {
        users: users.length,
        onlineQuantity,
        newUsersQuantity: newUsers.length,
        statistics: statisticsArray,
      };
    } catch (error) {
      console.error(error);
      throw new NotFoundException();
    }
  }

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Post('/role')
  async setRole(@Body() body: SetRoleDto, @Request() req: any) {
    const { id } = req.user;
    const foundUser = await this.usersService.getById(id);

    if (foundUser) {
      if (foundUser.role != Role.Admin) {
        throw new HttpException(
          'You have no permission! It is only for admins!',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (
      ![Role.Admin, Role.User, Role.Moderator].includes(body.role) ||
      !body.userId
    ) {
      throw new BadRequestException(`Invalid role: ${body.role}`);
    }

    const user = await this.usersService.getById(body.userId);
    user.role = body.role;

    this.usersService.saveUser(user);

    return 'Succeed';
  }
}
