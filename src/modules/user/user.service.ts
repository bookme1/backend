import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/User';
import { Poppler } from 'node-poppler';
import { promises as fsPromises } from 'fs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
    private readonly poppler: Poppler,
  ) {}

  findAll(): Promise<User[]> {
    return this.repository.find();
  }
  async getUserData(userId: number) {
    const user = await this.getById(userId);

    return { ...this.removePasswordFromUser(user) };
  }

  getById(id: number) {
    return this.repository.findOne({ where: { id } });
  }
  getByEmail(email: string) {
    return this.repository.findOne({ where: { email } });
  }

  async saveUser(payload: Partial<User>): Promise<User | null> {
    return await this.repository.save(payload);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  removePasswordFromUser(user: User) {
    const userData = { ...user };
    delete userData.password; // delete password from userData

    return userData;
  }

  async extract() {
    // Define options for PDF extraction to HTML
    const options = {
      firstPageToConvert: 1,
      lastPageToConvert: 10, // Adjust this according to your requirements
    };

    try {
      const htmlContent = await this.poppler.pdfToHtml(
        'src/temp/Faust.pdf',
        undefined,
        options,
      );
      const modifiedHtmlContent = htmlContent.replace(
        /src="src\/temp\//g,
        'src="', // Replace src="src/temp/ with src="
      );

      return modifiedHtmlContent;
    } catch (error) {
      throw new Error(`Failed to extract PDF to HTML: ${error.message}`);
    }
  }
}
