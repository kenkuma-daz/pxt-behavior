namespace behavior {

    export interface Behavior {
        // sprite : Sprite;
        update() : boolean;
        // moveTo(sprite: Sprite) : boolean;
    }

    export enum MovePattern {
        Bounce,
        TurnIfOnWall,
        BounceAndTurnOnSideWall,
        FlyAndTurnOnSideWall,
    }

    class SpriteBehavior implements Behavior {
        _sprite: Sprite;
        _vx: number;
        _vy: number;

        _move : Behavior;
        _follow : Behavior;
        _animation : Behavior;
        _attack : Behavior;

        constructor(sprite: Sprite) {
            this._sprite = sprite;
            this._sprite.setFlag(SpriteFlag.StayInScreen, false);
        }
        get sprite() : Sprite {
            return this._sprite;
        }
        vxvy(vx: number, vy: number) {
            this._sprite.vx = this._vx = Math.abs(vx);
            this._sprite.vy = this._vy = Math.abs(vy);
        }
        get x() : number {
            return this._sprite.x;
        }
        get y() : number {
            return this._sprite.y;
        }
        update() : boolean {
            let updated = true;
            if( updated && this._move )
                updated = this._move.update();
            if( updated && this._follow )
                updated = this._follow.update();
            if( this._animation )
                this._animation.update();
            if( this._attack )
                this._attack.update();
            return updated;
        }
        moveRight() {
            this._sprite.vx = this._vx;
        }
        moveLeft() {
            this._sprite.vx = this._vx * -1;
        }
        moveTo(target: Sprite) : boolean {
            if( target.x < this._sprite.x ) {
                this.moveLeft();
                return true;
            } else if( this._sprite.x < target.x ) {
                this.moveRight();
                return true;
            }
            return false;
        }
        fall() {
            let vy = this._sprite.vy;
            this._sprite.vy = Math.min(vy+8, this._vy);
        }
        jumpIfOnGround() : boolean {
            if (this._sprite.isHittingTile(CollisionDirection.Bottom)) {
                this._sprite.vy = this._vy * -1;
                return true;
            }
            return false;
        }
        ternIfOnWall() : boolean {
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

    class MoverBehavior implements Behavior {
        _parent: SpriteBehavior;
        constructor(parent: SpriteBehavior, vx: number, vy: number) {
            this._parent = parent;
            this._parent.vxvy(vx, vy);
        }
        update() : boolean {
            return false;
        }
    }

    class BounceBehavior extends MoverBehavior {
        constructor(parent: SpriteBehavior) {
            super(parent, 0, 120);
        }
        update() : boolean {
            this._parent.fall();
            return this._parent.jumpIfOnGround();
        }
    }

    class TurnIfOnWallBehavior extends MoverBehavior {
        constructor(parent: SpriteBehavior) {
            super(parent, 50, 200);
        }
        update() : boolean {
            this._parent.fall();
            this._parent.ternIfOnWall();
            return true;    // always true
        }
    }

    class BounceAndTurnOnSideWallBehavior extends MoverBehavior {
        constructor(parent: SpriteBehavior) {
            super(parent, 50, 200);
        }
        update() : boolean {
            this._parent.fall();

            if( this._parent.jumpIfOnGround() ) {
                return true;
            }
            
            if( this._parent.ternIfOnWall() ) {
                return true;
            }

            return false;
        }
    }

    class FlyAndTurnOnSideWallBehavior extends MoverBehavior {
        constructor(parent: SpriteBehavior) {
            super(parent, 50, 0);
        }
        update() : boolean {
            return this._parent.ternIfOnWall();
        }
    }

    class FollowerBehavior implements Behavior {
        _follower: SpriteBehavior
        _followTarget: Sprite;
        constructor(follower: SpriteBehavior, followTarget: Sprite) {
            this._follower = follower;
            this._followTarget = followTarget;
        }
        update() : boolean {
            return this._follower.moveTo(this._followTarget);
        }
    }

    class AnimationBehavior implements Behavior {
        _parent: SpriteBehavior;
        _leftImages: Image[];
        _rightImages: Image[];
        constructor(parent: SpriteBehavior, leftImages: Image[], rightImages: Image[]) {
            this._parent = parent;
            this._leftImages = leftImages;
            this._rightImages = rightImages;
        }
        update() : boolean {
            return true;
        }
    }

    class AttackerBehavior implements Behavior {
        _attacker: SpriteBehavior
        _attackTarget: Sprite;
        _bullet: Sprite
        _time: number;
        constructor(attacker: SpriteBehavior, attackTarget: Sprite, bullet: Sprite) {
            this._attacker = attacker;
            this._attackTarget = attackTarget;
            this._bullet = bullet;
            this._bullet.setFlag(SpriteFlag.Invisible, true);
            this._time = game.runtime();
        }
        update() : boolean {
            let time = game.runtime();

            let diff = time - this._time;
            if( diff > 1000) {
                this._onFire();
                this._time += diff;
            }

            return true;
        }

        protected _onFire() {

            let x = this._attackTarget.x - this._attacker.x;
            let y = this._attackTarget.y - this._attacker.y;

            if( Math.abs(x) < 5 && Math.abs(y) < 5)
                return;

            let n = Math.abs(x) + Math.abs(y);
            let vx = x / n * 150;
            let vy2 = y / n * 150;


            // console.log("_onFire() x:" + x + " y:" + y);

            let bullet = sprites.create(this._bullet.image, this._bullet.kind());
            bullet.setFlag(SpriteFlag.DestroyOnWall, true);
            bullet.vx = vx;
            bullet.vy = vy2;
            bullet.x = this._attacker.x;
            bullet.y = this._attacker.y;
        }
    }

    class Item {
        sprite:Sprite;
        behavior:SpriteBehavior;
    }

    let _items: Item[] = [];
    game.onUpdate(() => {
        for(let item of _items) {
            item.behavior.update();
        }
    })

    //% block="set $pattern pattern of $sprite=variables_get(aEnemy)"
    export function setPattern(sprite: Sprite, pattern: MovePattern) {
        let _item = _createOrGetItemBySprite(sprite);
        _item.behavior._move = _createMoverBehavior(_item.behavior, pattern);
    }

    //% block="set $sprite=variables_get(aEnemy) to follow $target=variables_get(mySprite)"
    export function setFollower(sprite: Sprite, target: Sprite) {
        let _item = _createOrGetItemBySprite(sprite);
        _item.behavior._follow = new FollowerBehavior(_item.behavior, target);
    }

    //% block="set $sprite=variables_get(aEnemy)|to animate left|$leftFrames=animation_editor|right|$rightFrames=animation_editor|interval|$interval (ms)"
    //% interval.shadow="timePicker"
    //% inlineInputMode=inline
    export function setAnimation(sprite: Sprite, leftFrames: Image[], rightFrames: Image[], interval: number) {
        let _item = _createOrGetItemBySprite(sprite);
        _item.behavior._animation = new AnimationBehavior(_item.behavior, leftFrames, rightFrames);
    }

    //% block="set $sprite=variables_get(aEnemy) to attack $target=variables_get(mySprite) by $bullet=variables_get(aBullet)"
    export function setAttacker(sprite: Sprite, target: Sprite, bullet: Sprite) {
        let _item = _createOrGetItemBySprite(sprite);
        _item.behavior._attack = new AttackerBehavior(_item.behavior, target, bullet);
    }

    function _createOrGetItemBySprite(sprite: Sprite) {
        let _item = _findItemBySprite(sprite);
        if( _item )
            return _item;

        _item = new Item();
        _item.sprite = sprite;
        _item.behavior = new SpriteBehavior(sprite);
        _addItem(_item);
        return _item;
    }

    function _addItem(item: Item) {
        item.sprite.onDestroyed(() => {
            let _item22 = _findItemBySprite(item.sprite);
            _items.removeElement(_item22);
        });
        _items.push(item);
        // console.log("_items.length:" + _items.length);
    }

    function _findItemBySprite(sprite:Sprite) {
        let found = _items.find((_item: Item, index: number) => {
            return _item.sprite == sprite;
        });
        if( found == undefined || found == null)
            return null
        return found;
    }

    function _createMoverBehavior(spriteBehavior: SpriteBehavior, pattern: MovePattern) : Behavior {
        switch(pattern) {
        case MovePattern.Bounce:
            return new BounceBehavior(spriteBehavior);
        case MovePattern.TurnIfOnWall:
            return new TurnIfOnWallBehavior(spriteBehavior);
        case MovePattern.BounceAndTurnOnSideWall:
            return new BounceAndTurnOnSideWallBehavior(spriteBehavior);
        case MovePattern.FlyAndTurnOnSideWall:
            return new FlyAndTurnOnSideWallBehavior(spriteBehavior);
        default:
            return null;
        }
    }

}

    // /**
    //  * Create and run an image animation on a sprite
    //  * @param frames the frames to animate through
    //  * @param sprite the sprite to animate on
    //  * @param frameInterval the time between changes, eg: 500
    //  */
    // //% blockId=run_image_animation
    // //% block="animate $sprite=variables_get(mySprite) frames $frames=animation_editor interval (ms) $frameInterval=timePicker loop $loop=toggleOnOff"
    // //% group="Animate"
    // //% weight=100
    // //% help=animation/run-image-animation
    // export function runImageAnimation(sprite: Sprite, frames: Image[], frameInterval?: number, loop?: boolean) {
    //     const anim = new ImageAnimation(sprite, frames, frameInterval || 500, !!loop);
    //     anim.init();
    // }

    // animation.runImageAnimation(
    // mySprite2,
    // [img`
    //     . . . . . . . . . . . . . . . . 
    //     . . . . . . . . . . . . . . . . 
    //     . . . . . . . . . b 5 5 b . . . 
    //     . . . . . . b b b b b b . . . . 
    //     . . . . . b b 5 5 5 5 5 b . . . 
    //     . b b b b b 5 5 5 5 5 5 5 b . . 
    //     . b d 5 b 5 5 5 5 5 5 5 5 b . . 
    //     . . b 5 5 b 5 d 1 f 5 d 4 f . . 
    //     . . b d 5 5 b 1 f f 5 4 4 c . . 
    //     b b d b 5 5 5 d f b 4 4 4 4 b . 
    //     b d d c d 5 5 b 5 4 4 4 4 4 4 b 
    //     c d d d c c b 5 5 5 5 5 5 5 b . 
    //     c b d d d d d 5 5 5 5 5 5 5 b . 
    //     . c d d d d d d 5 5 5 5 5 d b . 
    //     . . c b d d d d d 5 5 5 b b . . 
    //     . . . c c c c c c c c b b . . . 
    //     `,img`
    //     . . . . . . . . . . . . . . . . 
    //     . . . . . . . . . . b 5 b . . . 
    //     . . . . . . . . . b 5 b . . . . 
    //     . . . . . . b b b b b b . . . . 
    //     . . . . . b b 5 5 5 5 5 b . . . 
    //     . b b b b b 5 5 5 5 5 5 5 b . . 
    //     . b d 5 b 5 5 5 5 5 5 5 5 b . . 
    //     . . b 5 5 b 5 d 1 f 5 d 4 f . . 
    //     . . b d 5 5 b 1 f f 5 4 4 c . . 
    //     b b d b 5 5 5 d f b 4 4 4 4 4 b 
    //     b d d c d 5 5 b 5 4 4 4 4 4 b . 
    //     c d d d c c b 5 5 5 5 5 5 5 b . 
    //     c b d d d d d 5 5 5 5 5 5 5 b . 
    //     . c d d d d d d 5 5 5 5 5 d b . 
    //     . . c b d d d d d 5 5 5 b b . . 
    //     . . . c c c c c c c c b b . . . 
    //     `,img`
    //     . . . . . . . . . . b 5 b . . . 
    //     . . . . . . . . . b 5 b . . . . 
    //     . . . . . . . . . b c . . . . . 
    //     . . . . . . b b b b b b . . . . 
    //     . . . . . b b 5 5 5 5 5 b . . . 
    //     . . . . b b 5 d 1 f 5 5 d f . . 
    //     . . . . b 5 5 1 f f 5 d 4 c . . 
    //     . . . . b 5 5 d f b d d 4 4 . . 
    //     b d d d b b d 5 5 5 4 4 4 4 4 b 
    //     b b d 5 5 5 b 5 5 4 4 4 4 4 b . 
    //     b d c 5 5 5 5 d 5 5 5 5 5 b . . 
    //     c d d c d 5 5 b 5 5 5 5 5 5 b . 
    //     c b d d c c b 5 5 5 5 5 5 5 b . 
    //     . c d d d d d d 5 5 5 5 5 d b . 
    //     . . c b d d d d d 5 5 5 b b . . 
    //     . . . c c c c c c c c b b . . . 
    //     `,img`
    //     . . . . . . . . . . b 5 b . . . 
    //     . . . . . . . . . b 5 b . . . . 
    //     . . . . . . b b b b b b . . . . 
    //     . . . . . b b 5 5 5 5 5 b . . . 
    //     . . . . b b 5 d 1 f 5 d 4 c . . 
    //     . . . . b 5 5 1 f f d d 4 4 4 b 
    //     . . . . b 5 5 d f b 4 4 4 4 b . 
    //     . . . b d 5 5 5 5 4 4 4 4 b . . 
    //     . . b d d 5 5 5 5 5 5 5 5 b . . 
    //     . b d d d d 5 5 5 5 5 5 5 5 b . 
    //     b d d d b b b 5 5 5 5 5 5 5 b . 
    //     c d d b 5 5 d c 5 5 5 5 5 5 b . 
    //     c b b d 5 d c d 5 5 5 5 5 5 b . 
    //     . b 5 5 b c d d 5 5 5 5 5 d b . 
    //     b b c c c d d d d 5 5 5 b b . . 
    //     . . . c c c c c c c c b b . . . 
    //     `,img`
    //     . . . . . . . . . . b 5 b . . . 
    //     . . . . . . . . . b 5 b . . . . 
    //     . . . . . . b b b b b b . . . . 
    //     . . . . . b b 5 5 5 5 5 b . . . 
    //     . . . . b b 5 d 1 f 5 d 4 c . . 
    //     . . . . b 5 5 1 f f d d 4 4 4 b 
    //     . . . . b 5 5 d f b 4 4 4 4 b . 
    //     . . . b d 5 5 5 5 4 4 4 4 b . . 
    //     . b b d d d 5 5 5 5 5 5 5 b . . 
    //     b d d d b b b 5 5 5 5 5 5 5 b . 
    //     c d d b 5 5 d c 5 5 5 5 5 5 b . 
    //     c b b d 5 d c d 5 5 5 5 5 5 b . 
    //     c b 5 5 b c d d 5 5 5 5 5 5 b . 
    //     b b c c c d d d 5 5 5 5 5 d b . 
    //     . . . . c c d d d 5 5 5 b b . . 
    //     . . . . . . c c c c c b b . . . 
    //     `,img`
    //     . . . . . . . . . . b 5 b . . . 
    //     . . . . . . . . . b 5 b . . . . 
    //     . . . . . . b b b b b b . . . . 
    //     . . . . . b b 5 5 5 5 5 b . . . 
    //     . . . . b b 5 d 1 f 5 5 d f . . 
    //     . . . . b 5 5 1 f f 5 d 4 c . . 
    //     . . . . b 5 5 d f b d d 4 4 . . 
    //     . b b b d 5 5 5 5 5 4 4 4 4 4 b 
    //     b d d d b b d 5 5 4 4 4 4 4 b . 
    //     b b d 5 5 5 b 5 5 5 5 5 5 b . . 
    //     c d c 5 5 5 5 d 5 5 5 5 5 5 b . 
    //     c b d c d 5 5 b 5 5 5 5 5 5 b . 
    //     . c d d c c b d 5 5 5 5 5 d b . 
    //     . . c b d d d d d 5 5 5 b b . . 
    //     . . . c c c c c c c c b b . . . 
    //     . . . . . . . . . . . . . . . . 
    //     `],
    // 200,
    // true
    // )
