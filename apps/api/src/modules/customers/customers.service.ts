import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateCustomerInput, Customer } from '@caliper/shared';
import { PrismaService } from '../../common/prisma/prisma.service';

type DbCustomer = {
  id: string;
  code: string;
  name: string;
  gstin: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Customer[]> {
    const rows = await this.prisma.customer.findMany({ orderBy: { name: 'asc' } });
    return rows.map(CustomersService.toDto);
  }

  async findOne(id: string): Promise<Customer> {
    const row = await this.prisma.customer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' });
    return CustomersService.toDto(row);
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const row = await this.prisma.customer.create({
      data: {
        code: input.code,
        name: input.name,
        gstin: input.gstin || null,
        contactName: input.contactName || null,
        email: input.email || null,
        phone: input.phone || null,
      },
    });
    return CustomersService.toDto(row);
  }

  static toDto(c: DbCustomer): Customer {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      gstin: c.gstin,
      contactName: c.contactName,
      email: c.email,
      phone: c.phone,
    };
  }
}
