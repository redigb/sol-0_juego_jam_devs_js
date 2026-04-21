import * as Phaser from 'phaser';

export type TowerState = 'CLOSED' | 'OPENING' | 'OPENED' | 'CLOSING';

export class EnergyTower extends Phaser.GameObjects.Sprite {
    private currentState: TowerState = 'CLOSED';

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Inicialmente con el primer frame de opening para que se vea cerrada
        super(scene, x, y, 'tower-opening', 0);
        scene.add.existing(this);
        
        this.setOrigin(0.5, 1);
        this.setScale(3.5);
        this.setDepth(y);

        // Configurar eventos de animación para la máquina de estados
        this.on('animationcomplete', (animation: Phaser.Animations.Animation) => {
            if (animation.key === 'tower-opening') {
                this.setTowerState('OPENED');
            } else if (animation.key === 'tower-closing') {
                this.setTowerState('CLOSED');
            }
        });
    }

    public setTowerState(state: TowerState) {
        if (this.currentState === state) return;

        this.currentState = state;

        switch (state) {
            case 'OPENING':
                this.play('tower-opening');
                break;
            case 'OPENED':
                this.play('tower-opened-idle');
                break;
            case 'CLOSING':
                this.play('tower-closing');
                break;
            case 'CLOSED':
                this.stop();
                this.setTexture('tower-opening', 0);
                break;
        }
    }

    public getTowerState(): TowerState {
        return this.currentState;
    }
}
