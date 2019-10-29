//=============================================================================
// kbt_UpdateStateOnTurnEnd
// ターン終了時と行動後のステート更新処理を上書きするプラグインです。
// Last Updated: 2019.08.08
//
// Copyright (c) 2019 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.01/ターン終了時と行動後のステート更新処理を上書きするプラグインです。
 * @author 小鳩箱
 * 
 * @help
 * ターン終了時と行動後のステート更新処理を、以下の内容で上書きします。
 *
 * ・ターン終了時、ステートの残りターン数が2以上減らないようにする。
 * ・連続行動時、最後の行動の時だけステートの残りターン数が1減るようにする。
 */

(function() {
    'use strict';

    var _isTurnEnd;
    var _isLastAction;
    var _listAction = [];

    var _Battle_Manager_startTurn = BattleManager.startTurn;
    BattleManager.startTurn = function() {
        _isTurnEnd = true;
        _isLastAction = false;
        _listAction = [];
        _Battle_Manager_startTurn.call(this);

        // パーティメンバーの行動回数をセット
        $gameParty._actors.forEach(function(actor) {
            var action = {
                'type':'actor',
                'id':actor,
                'action':$gameActors.actor(actor)._actions.length
            };
            _listAction.push(action);
        }, this);

        // エネミーの行動回数をセット
        $gameTroop._enemies.forEach(function(enemy) {
            var action = {
                'type':'enemy',
                'index':enemy.index(),
                'action':enemy._actions.length
            };
            _listAction.push(action);
        }, this);
    };

    var _Battle_Manager_processTurn = BattleManager.processTurn;
    BattleManager.processTurn = function() {

        // ステートの残りターン計算は最終アクションの時のみ実行
        var subject = this._subject;
        var action = subject.currentAction();
        if (action) {
            action.prepare();
            if (action.isValid()) {
                this.startAction();
            }

            // 残り行動回数をチェック
            _listAction.forEach(function(act, inx) {
                // アクターの行動
                if (action._subjectActorId > 0) {
                    if (act.type === 'actor' && act.id === action._subjectActorId) {
                        if (act.action === 1) {
                            // 最終アクション
                            _isLastAction = true;
                            _listAction[inx].action = -100;
                        } else {
                            _listAction[inx].action --;
                        }
                    }

                // エネミーの行動
                } else {
                    if (act.type === 'enemy' && act.index === action._subjectEnemyIndex) {
                        if (act.action === 1) {
                            // 最終アクション
                            _isLastAction = true;
                            _listAction[inx].action = -100;
                        } else {
                            _listAction[inx].action --;
                        }
                    }
                }
            }, this);

            subject.removeCurrentAction();

        } else {
            // 行動不能の対象が残っていないかチェック
            _listAction.forEach(function(act, inx) {
                // アクターの行動
                if (subject._actorId) {
                    if (act.type === 'actor' && act.id === subject._actorId) {
                        if (act.action === 0) {
                            // 最終アクション
                            _isLastAction = true;
                            _listAction[inx].action = -100;
                        }
                    }

                // エネミーの行動
                } else {
                    if (act.type === 'enemy' && act.index === subject.index()) {
                        if (act.action === 0) {
                            // 最終アクション
                            _isLastAction = true;
                            _listAction[inx].action = -100;
                        }
                    }
                }
            }, this);

            // 最後のアクションの時だけ、ステートの残りターン数を計算する
            if (_isLastAction) {
                subject.onAllActionsEnd();
                this.refreshStatus();
                this._logWindow.displayAutoAffectedStatus(subject);
                this._logWindow.displayCurrentState(subject);
                this._logWindow.displayRegeneration(subject);
                _isLastAction = false;
            }

            this._subject = this.getNextSubject();
        }
    };

    var _Battle_Manager_onTurnEnd = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        var _isForcedTurn = false;

        if (this.isForcedTurn()) {
            _isForcedTurn = true;
        }
        if (!_isTurnEnd) {
            // 既にターン終了時の計算が終わっていたらフラグを操作
            this._turnForced = true;
            _isForcedTurn = false;
        }
        _Battle_Manager_onTurnEnd.call(this);

        if (_isForcedTurn) {
            // ステートの残りターン数計算がスキップされていたら、再度ターン終了処理
            this.allBattleMembers().forEach(function(battler) {
                battler.onTurnEnd();
                this.refreshStatus();
                this._logWindow.displayAutoAffectedStatus(battler);
                this._logWindow.displayRegeneration(battler);
            }, this);
        }
        _isTurnEnd = false;
    };
})();
