import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';
import { UpdateCategoryDto } from './dto/category.dto';
import { slugify } from '../common/utils/helpers';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async findAll(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    return this.prisma.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
        products: {
          where: { status: 'ACTIVE' },
          take: 10,
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
        products: {
          where: { status: 'ACTIVE' },
          include: {
            images: {
              where: { isMain: true },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async getTree() {
    const categories = await this.prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
            },
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  // ==================== ADMIN ENDPOINTS ====================

  async create(createCategoryDto: CreateCategoryDto) {
    const slug = slugify(createCategoryDto.name);

    // Check if slug exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    // If parentId is provided, check if parent exists
    if (createCategoryDto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    await this.findOne(id);

    // If name is being updated, regenerate slug
    let slug: string | undefined;
    if (updateCategoryDto.name) {
      slug = slugify(updateCategoryDto.name);

      // Check if new slug conflicts with another category
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    // Prevent circular reference
    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      // Check if the new parent is a descendant
      const isDescendant = await this.isDescendant(
        id,
        updateCategoryDto.parentId,
      );
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a descendant category as parent',
        );
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        ...(slug && { slug }),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return category;
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    // Check if category has products
    if (category._count.products > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Move or delete products first.',
      );
    }

    // Check if category has children
    if (category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete subcategories first.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { message: 'Category successfully deleted' };
  }

  // ==================== HELPERS ====================

  private async isDescendant(
    categoryId: string,
    potentialAncestorId: string,
  ): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { id: potentialAncestorId },
      select: { parentId: true },
    });

    if (!category || !category.parentId) {
      return false;
    }

    if (category.parentId === categoryId) {
      return true;
    }

    return this.isDescendant(categoryId, category.parentId);
  }
}
