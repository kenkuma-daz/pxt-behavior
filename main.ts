//% color="0x20B020"
namespace behavior {

    export interface Behavior {
        sprite : Sprite;
        target : Sprite;
        update() : boolean ;
    }

    export enum MovePattern {
        Bounce,
        TurnIfOnWall,
        BounceAndTurnOnSideWall,
        FlyAndTurnOnSideWall,
    }

    class MoverBehavior implements Behavior {
        _sprite: Sprite;
        _vx: number;
        _vy: number;
        constructor(sprite: Sprite, vx: number, vy: number) {
            this._sprite = sprite;
            this._sprite.vx = this._vx = Math.abs(vx);
            this._sprite.vy = this._vy = Math.abs(vy);
        }
        get sprite() : Sprite {
            return this._sprite;
        }
        get target() : Sprite {
            return null;
        }
        update() : boolean {
            return false;
        }
        moveRight() {
            this._sprite.vx = this._vx;
        }
        moveLeft() {
            this._sprite.vx = this._vx * -1;
        }
        protected _fall() {
            let vy = this._sprite.vy;
            this._sprite.vy = Math.min(vy+8, this._vy);
        }
        protected _jumpIfOnGround() : boolean {
            if (this._sprite.isHittingTile(CollisionDirection.Bottom)) {
                this._sprite.vy = this._vy * -1;
                return true;
            }
            return false;
        }
        protected _ternIfOnWall() : boolean {
            if (this._sprite.isHittingTile(CollisionDirection.Left)) {
                this.moveRight();
                return true;
            } else if (this._sprite.isHittingTile(CollisionDirection.Right)) {
                this.moveLeft();
                return true;
            }
            return false;
        }
    }

    class BounceBehavior extends MoverBehavior {
        constructor(sprite: Sprite) {
            super(sprite, 0, 120);
        }
        update() : boolean {
            this._fall();
            return this._jumpIfOnGround();
        }
    }

    class TurnIfOnWallBehavior extends MoverBehavior {
        constructor(sprite: Sprite) {
            super(sprite, 50, 200);
        }
        update() : boolean {
            this._fall();
            this._ternIfOnWall();
            return true;    // always true
        }
    }

    class BounceAndTurnOnSideWallBehavior extends MoverBehavior {
        constructor(sprite: Sprite) {
            super(sprite, 50, 200);
        }
        update() : boolean {
            this._fall();

            if( this._jumpIfOnGround() ) {
                return true;
            }
            
            if( this._ternIfOnWall() ) {
                return true;
            }

            return false;
        }
    }

    class FlyAndTurnOnSideWallBehavior extends MoverBehavior {
        constructor(sprite: Sprite) {
            super(sprite, 50, 0);
        }
        update() : boolean {
            return this._ternIfOnWall();
        }
    }

    class ChaserBehavior implements Behavior {
        _mover: MoverBehavior
        _target: Sprite;
        constructor(mover: MoverBehavior, target: Sprite) {
            this._mover = mover;
            this._target = target;
        }
        get sprite() {
            return this._mover.sprite;
        }
        get target() : Sprite {
            return this._target;
        }
        update() : boolean {
            if( !this._mover.update() )
                return false;

            if( this._target.x < this._mover.sprite.x ) {
                this._mover.moveLeft();
            } else if( this._mover.sprite.x < this._target.x ) {
                this._mover.moveRight();
            }

            return true;
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
    export function setPattern(sprite: Sprite, pattern: MovePattern) {
        let _behavior = _createBehavior(sprite, pattern);
        if( !_behavior )
            return;

        sprite.setFlag(SpriteFlag.StayInScreen, false);

        let item = new Item();
        item.sprite = sprite;
        item.value = _behavior;
        _addItem(item);
    }

    //% block="set $sprite=variables_get(aEnemy) to follow $target=variables_get(mySprite)"
    export function setFollower(sprite: Sprite, target: Sprite) {
        let _item = _findItemBySprite(sprite);
        if( !_item )
            return;

        _item.value = new ChaserBehavior(_item.value as MoverBehavior, target);
    }

    function _addItem(item: Item) {
        item.sprite.onDestroyed(() => {
            let _item = _findItemBySprite(item.sprite);
            _items.removeElement(_item);
        });
        _items.push(item);
        console.log("_items.length:" + _items.length);
    }

    function _findItemBySprite(sprite:Sprite) {
        let found = _items.find((_item: Item, index: number) => {
            return _item.sprite == sprite;
        });
        if( found == undefined || found == null)
            return null
        return found;
    }

    function _createBehavior(sprite: Sprite, pattern: MovePattern) : Behavior {
        switch(pattern) {
        case MovePattern.Bounce:
            return new BounceBehavior(sprite);
        case MovePattern.TurnIfOnWall:
            return new TurnIfOnWallBehavior(sprite);
        case MovePattern.BounceAndTurnOnSideWall:
            return new BounceAndTurnOnSideWallBehavior(sprite);
        case MovePattern.FlyAndTurnOnSideWall:
            return new FlyAndTurnOnSideWallBehavior(sprite);
        default:
            return null;
        }
    }

}
