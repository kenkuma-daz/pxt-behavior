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

    export enum ChasePattern {
        Chaser,
    }

    namespace move {

        class BounceBehavior implements Behavior {
            _sprite: Sprite;
            constructor(sprite: Sprite) {
                this._sprite = sprite;
                this._sprite.vy = 200;
            }
            update() : void {
                let vy = this._sprite.vy;
                this._sprite.vy = Math.min(vy+8, 200);

                if (this._sprite.isHittingTile(CollisionDirection.Bottom)) {
                    this._sprite.vy = -200;
                }
            }
        }

        class TurnOnSideWallBehavior implements Behavior {
            _sprite: Sprite;
            constructor(sprite: Sprite) {
                this._sprite = sprite;
                this._sprite.vx = 50;
                this._sprite.vy = 200;
            }
            update() : void {
                let vy2 = this._sprite.vy;
                this._sprite.vy = Math.min(vy2+10, 200);

                if (this._sprite.isHittingTile(CollisionDirection.Left)) {
                    this._sprite.vx = 50;
                } else if (this._sprite.isHittingTile(CollisionDirection.Right)) {
                    this._sprite.vx = -50;
                }
            }
        }

        class BounceAndTurnOnSideWallBehavior implements Behavior {
            _sprite: Sprite;
            constructor(sprite: Sprite) {
                this._sprite = sprite;
                this._sprite.vx = 50;
                this._sprite.vy = 200;
            }
            update() : void {
                let vy3 = this._sprite.vy;
                this._sprite.vy = Math.min(vy3+6, 200);

                if (this._sprite.isHittingTile(CollisionDirection.Bottom)) {
                    this._sprite.vy = -200;
                }

                if (this._sprite.isHittingTile(CollisionDirection.Left)) {
                    this._sprite.vx = 50;
                } else if (this._sprite.isHittingTile(CollisionDirection.Right)) {
                    this._sprite.vx = -50;
                }
            }
        }

        class FlyAndTurnOnSideWallBehavior implements Behavior {
            _sprite: Sprite;
            constructor(sprite: Sprite) {
                this._sprite = sprite;
                this._sprite.vx = 40;
            }
            update() : void {
                if (this._sprite.isHittingTile(CollisionDirection.Left)) {
                    this._sprite.vx = 40;
                } else if (this._sprite.isHittingTile(CollisionDirection.Right)) {
                    this._sprite.vx = -40;
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

    namespace chase {

        class ChaserBehavior implements Behavior {
            _target: Sprite;
            _follower: Sprite;
            constructor(target: Sprite, follower: Sprite) {
                this._target = target;
                this._follower = follower;
                this._follower.vy = 200;
            }
            update() : void {
                let vy = this._follower.vy;
                this._follower.vy = Math.min(vy+8, 200);

                if (this._follower.isHittingTile(CollisionDirection.Bottom)) {
                    this._follower.vy = -200;

                    if( this._follower.x < this._target.x ) {
                        this._follower.vx = 30;
                    } else if( this._target.x < this._follower.x ) {
                        this._follower.vx = -30;
                    }

                }


            }
        }

        export function createBehavior(target: Sprite, follower: Sprite, pattern: ChasePattern) : Behavior {
            switch(pattern) {
            case ChasePattern.Chaser:
                return new ChaserBehavior(target, follower);
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
    game.onUpdate(() => {
        for(let item of _items) {
            item.value.update();
        }
    })

    //% block="set $pattern pattern of $sprite=variables_get(aEnemy)"
    export function setMovePattern(sprite: Sprite, pattern: MovePattern) {
        sprite.onDestroyed(() => {
            let found = _items.find((item: Item, index: number) => {
                return item.sprite == sprite;
            });
            _items.removeElement(found);
        });
        let item = new Item();
        item.sprite = sprite;
        item.value = move.createBehavior(sprite, pattern);
        _items.push(item);
    }

    //% block="set $pattern pattern of $follower=variables_get(aEnemy) $target=variables_get(mySprite)"
    export function setChasePattern(target: Sprite, follower: Sprite, pattern: ChasePattern) {
        follower.onDestroyed(() => {
            let found = _items.find((item: Item, index: number) => {
                return item.sprite == follower;
            });
            _items.removeElement(found);
        });
        let item = new Item();
        item.sprite = follower;
        item.value = chase.createBehavior(target, follower, pattern);
        _items.push(item);
    }

}
