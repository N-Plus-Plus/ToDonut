export interface UndoReceipt {
  id: string;
  label: string;
  expiresAt: number;
  run: () => void | Promise<void>;
  used?: boolean;
}

export class UndoService {
  private receipt: UndoReceipt | null = null;

  register(receipt: Omit<UndoReceipt, "used">): UndoReceipt {
    this.receipt = { ...receipt, used: false };
    return this.receipt;
  }

  active(now = Date.now()): UndoReceipt | null {
    if (!this.receipt || this.receipt.used || this.receipt.expiresAt <= now) return null;
    return this.receipt;
  }

  async execute(id: string, now = Date.now()): Promise<boolean> {
    const receipt = this.active(now);
    if (!receipt || receipt.id !== id) return false;
    receipt.used = true;
    await receipt.run();
    return true;
  }
}
