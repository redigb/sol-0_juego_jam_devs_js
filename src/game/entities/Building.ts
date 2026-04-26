import * as Phaser from 'phaser';

export interface Building extends Phaser.Physics.Arcade.Sprite {
    hp: number;
    maxHp: number;
    isDead: boolean;
    takeDamage(amount: number): void;
    repair(amount: number): boolean;
    die(): void;
}
