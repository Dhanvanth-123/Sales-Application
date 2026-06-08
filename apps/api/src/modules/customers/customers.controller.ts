import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createCustomerSchema, type CreateCustomerInput, type Customer } from '@caliper/shared';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  list(): Promise<Customer[]> {
    return this.customers.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Customer> {
    return this.customers.findOne(id);
  }

  @Post()
  @Roles('COSTING', 'SALES')
  create(
    @Body(new ZodValidationPipe(createCustomerSchema)) body: CreateCustomerInput,
  ): Promise<Customer> {
    return this.customers.create(body);
  }
}
