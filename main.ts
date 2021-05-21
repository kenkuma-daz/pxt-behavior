//% color="0x20B020"
namespace behavior {

    export interface Behavior {
        update() : void
    }

    export enum MovePattern {
        Bounce,
        TurnOnSideWall,
        BounceAndTurnOnSideWall,
        FlyAndTurnOnSideWall,
    }

    namespace move {

        class BounceBehavior implements Behavior {
            _target: Sprite;
            constructor(sprite: Sprite) {
                this._target = sprite;
                this._target.vy = 200;
            }
            update() : void {
                let vy = this._target.vy;
                this._target.vy = Math.min(vy+8, 200);

                if (this._target.isHittingTile(CollisionDirection.Bottom)) {
                    this._target.vy = -200;
                }
            }
        }

        class TurnOnSideWallBehavior implements Behavior {
            _target: Sprite;
            constructor(sprite: Sprite) {
                this._target = sprite;
                this._target.vx = 30;
                this._target.vy = 200;
            }
            update() : void {
                let vy2 = this._target.vy;
                this._target.vy = Math.min(vy2+10, 200);

                if (this._target.isHittingTile(CollisionDirection.Left)) {
                    this._target.vx = 30;
                } else if (this._target.isHittingTile(CollisionDirection.Right)) {
                    this._target.vx = -30;
                }
            }
        }

        class BounceAndTurnOnSideWallBehavior implements Behavior {
            _target: Sprite;
            constructor(sprite: Sprite) {
                this._target = sprite;
                this._target.vx = 50;
                this._target.vy = 200;
            }
            update() : void {
                let vy3 = this._target.vy;
                this._target.vy = Math.min(vy3+6, 200);

                if (this._target.isHittingTile(CollisionDirection.Bottom)) {
                    this._target.vy = -120;
                }

                if (this._target.isHittingTile(CollisionDirection.Left)) {
                    this._target.vx = 50;
                } else if (this._target.isHittingTile(CollisionDirection.Right)) {
                    this._target.vx = -50;
                }
            }
        }

        class FlyAndTurnOnSideWallBehavior implements Behavior {
            _target: Sprite;
            constructor(sprite: Sprite) {
                this._target = sprite;
                this._target.vx = 40;
            }
            update() : void {
                if (this._target.isHittingTile(CollisionDirection.Left)) {
                    this._target.vx = 40;
                } else if (this._target.isHittingTile(CollisionDirection.Right)) {
                    this._target.vx = -40;
                }
            }
        }

        export function createBehavior(sprite: Sprite, pattern: MovePattern) : Behavior {
            switch(pattern) {
            case MovePattern.Bounce:
                return new BounceBehavior(sprite);
            case MovePattern.TurnOnSideWall:
                return new TurnOnSideWallBehavior(sprite);
            case MovePattern.BounceAndTurnOnSideWall:
                return new BounceAndTurnOnSideWallBehavior(sprite);
            case MovePattern.FlyAndTurnOnSideWall:
                return new FlyAndTurnOnSideWallBehavior(sprite);
            default:
                return null;
            }
        }
    }

    class Item {
        sprite:Sprite;
        value:Behavior;
    }

    let _items: Item[] = [];
    // game.onUpdate(() => {
    //     for(let item of _items) {
    //         item.behavior.update();
    //     }
    // })

    game.onUpdate(function() {
        for(let item of _items) {
            item.value.update();
        }
    })

    //% block="set $pattern pattern of $sprite=variables_get(aEnemy)"
    export function setPattern(sprite: Sprite, pattern: MovePattern) {
        // sprite.onDestroyed(() => {
        //     let found = _items.find((item: Item, index: number) => {
        //         return item.sprite == sprite;
        //     });
        //     _items.removeElement(found);
        // });
        let item = new Item();
        item.sprite = sprite;
        item.value = move.createBehavior(sprite, pattern);
        _items.push(item);
    }
}
