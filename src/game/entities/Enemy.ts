import * as Phaser from 'phaser';

export interface Enemy extends Phaser.Physics.Arcade.Sprite {
    isDead: boolean;
    isCollectable: boolean;
    takeDamage(amount: number): void;
    collect(): number;
    setTarget(target: Phaser.GameObjects.Components.Transform | null): void;
    getResourceType(): 'scrap' | 'energy';
}
