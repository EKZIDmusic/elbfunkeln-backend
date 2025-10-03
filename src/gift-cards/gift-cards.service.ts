import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PurchaseGiftCardDto,
  CreateGiftCardDto,
  UpdateGiftCardDto,
  ValidateGiftCardDto,
} from './dto/gift-card.dto';
import { generateUniqueCode } from '../common/utils/helpers';

@Injectable()
export class GiftCardsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  async purchase(userId: string, purchaseGiftCardDto: PurchaseGiftCardDto) {
    const { amount, recipientEmail, recipientName, message } =
      purchaseGiftCardDto;

    // Generate unique code
    const code = generateUniqueCode('GIFT', 12);

    // Set expiration date (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const giftCard = await this.prisma.giftCard.create({
      data: {
        code,
        initialValue: amount,
        currentValue: amount,
        purchasedBy: userId,
        recipientEmail,
        recipientName,
        message,
        expiresAt,
        isActive: true,
      },
    });

    // TODO: Send gift card email to recipient
    // TODO: Process payment for gift card

    return {
      ...giftCard,
      // Don't expose full code immediately, wait for payment confirmation
      code: code.substring(0, 4) + '****',
    };
  }

  async validate(validateGiftCardDto: ValidateGiftCardDto) {
    const { code } = validateGiftCardDto;

    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (!giftCard.isActive) {
      throw new BadRequestException('Gift card is not active');
    }

    if (giftCard.currentValue <= 0) {
      throw new BadRequestException('Gift card has no remaining balance');
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      throw new BadRequestException('Gift card has expired');
    }

    return {
      valid: true,
      code: giftCard.code,
      currentValue: Number(giftCard.currentValue),
      expiresAt: giftCard.expiresAt,
    };
  }

  async checkBalance(code: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    return {
      code: giftCard.code,
      initialValue: Number(giftCard.initialValue),
      currentValue: Number(giftCard.currentValue),
      isActive: giftCard.isActive,
      expiresAt: giftCard.expiresAt,
    };
  }

  async applyToOrder(code: string, amount: number) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (!giftCard.isActive) {
      throw new BadRequestException('Gift card is not active');
    }

    if (giftCard.currentValue < amount) {
      throw new BadRequestException('Insufficient gift card balance');
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      throw new BadRequestException('Gift card has expired');
    }

    // Deduct amount from gift card
    const updatedGiftCard = await this.prisma.giftCard.update({
      where: { code: code.toUpperCase() },
      data: {
        currentValue: {
          decrement: amount,
        },
      },
    });

    return {
      code: updatedGiftCard.code,
      amountUsed: amount,
      remainingBalance: Number(updatedGiftCard.currentValue),
    };
  }

  // ==================== ADMIN ENDPOINTS ====================

  async create(createGiftCardDto: CreateGiftCardDto) {
    const code = generateUniqueCode('GIFT', 12);

    const expiresAt = createGiftCardDto.expiresAt
      ? new Date(createGiftCardDto.expiresAt)
      : null;

    const giftCard = await this.prisma.giftCard.create({
      data: {
        code,
        initialValue: createGiftCardDto.initialValue,
        currentValue: createGiftCardDto.initialValue,
        purchasedBy: createGiftCardDto.purchasedBy,
        recipientEmail: createGiftCardDto.recipientEmail,
        recipientName: createGiftCardDto.recipientName,
        message: createGiftCardDto.message,
        expiresAt,
        isActive: true,
      },
    });

    return giftCard;
  }

  async findAll() {
    return this.prisma.giftCard.findMany({
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const giftCard = await this.prisma.giftCard.findUnique({
      where: { id },
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    return giftCard;
  }

  async update(id: string, updateGiftCardDto: UpdateGiftCardDto) {
    await this.findOne(id);

    const updateData: any = { ...updateGiftCardDto };

    if (updateGiftCardDto.expiresAt) {
      updateData.expiresAt = new Date(updateGiftCardDto.expiresAt);
    }

    return this.prisma.giftCard.update({
      where: { id },
      data: updateData,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);

    return this.prisma.giftCard.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats() {
    const [totalGiftCards, activeGiftCards, totalValue, usedValue] =
      await Promise.all([
        this.prisma.giftCard.count(),
        this.prisma.giftCard.count({ where: { isActive: true } }),
        this.prisma.giftCard.aggregate({
          _sum: { initialValue: true },
        }),
        this.prisma.giftCard.aggregate({
          _sum: { currentValue: true },
        }),
      ]);

    const totalValueNum = Number(totalValue._sum.initialValue || 0);
    const usedValueNum = Number(usedValue._sum.currentValue || 0);

    return {
      totalGiftCards,
      activeGiftCards,
      totalValueIssued: totalValueNum,
      currentBalance: usedValueNum,
      totalUsed: totalValueNum - usedValueNum,
    };
  }
}
