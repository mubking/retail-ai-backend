import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  searchByName(name: string) {
    return this.productRepo
      .createQueryBuilder('product')
      .where('LOWER(product.name) LIKE :name', { name: `%${name}%` })
      .getMany();
  }

  findAll() {
    return this.productRepo.find();
  }

  findOne(id: string) {
    return this.productRepo.findOneBy({ id });
  }

  create(data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async update(id: string, data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.productRepo.delete(id);
    return { message: 'Product deleted' };
  }
  async bulkCreate(products: Partial<Product>[]) {
    const entities = products.map((p) => this.productRepo.create(p));
    return this.productRepo.save(entities);
  }
}
