//=============================================================================
// kbt_ReraiseState
// 戦闘不能時に一度だけ耐えるステートを設定するプラグインです。
// Last Updated: 2019.07.20
//
// Copyright (c) 2019 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.01/戦闘不能時に一度だけ耐えるステートを設定するプラグインです。
 * @author 小鳩箱
 * 
 * @help
 * HPが0以下になった時、一度だけ耐えてHPを回復するステートを設定するためのプラグインです。
 * ステートのメモ欄に、以下のように記述してください。両方の記述が必要です。
 * 確率は正の整数で指定してください。
 *
 *  <ReraiseCure:[回復量（％）]>
 *  <ReraiseRate:[発動率（％）]>
 *
 * 例１：必ずHP1で踏みとどまるステート
 *  <ReraiseCure:0>
 *  <ReraiseRate:100>
 *
 * 例２：50%の確率で踏みとどまり、更にHPを10%回復するステート
 *  <ReraiseCure:10>
 *  <ReraiseRate:50>
 *
 * 攻撃に耐えた後に回復する場合は、回復直前にメッセージを表示することができます。任意項目です。
 *  <ReraiseMessage:[回復メッセージ]>
 *
 * メッセージに%1と書くと発動者名、%2と書くとステート名に置換されます。
 * 以下のように書くと、「ハロルドの食いしばりが発動！」のように表示されます。
 *  <ReraiseMessage:%1の%2が発動！>
 */

(function(){
    'use strict';

    var _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {

        var reraise_cure = 0;
        var reraise_rate = 0;
        var reraise_state = 0;
        var reraise_act = false;
        if (value >= target._hp) {
            target._states.forEach(function(state) {
                if ($dataStates[state].meta['ReraiseCure'] && $dataStates[state].meta['ReraiseRate'] && !reraise_act) {
                    reraise_state = state;
                    reraise_cure = Math.max(reraise_cure, $dataStates[state].meta['ReraiseCure']);
                    reraise_rate = Math.max(reraise_rate, $dataStates[state].meta['ReraiseRate']);

                    if (Math.floor(Math.random() * 100) <= reraise_rate) {
                        reraise_act = true;
                    }
                }
            });
        }

        // ダメージを受ける
        if (reraise_act) {
            value = target._hp - 1;
        }
        _Game_Action_executeHpDamage.call(this, target, value);

        if (reraise_act) {
            // ステートを解除
            if (target._actorId) {
                $gameActors.actor(target._actorId).removeState(reraise_state);
            } else {
                $gameTroop.members()[target.index()].removeState(reraise_state);
            }
            var cure = Math.floor(target.mhp * reraise_cure / 100);
            if (cure > 0) {
                // 回復するとダメージ表示が上書きされるので、ログに出力し直し
                BattleManager._logWindow.displayDamage(target);
                if ($dataStates[reraise_state].meta['ReraiseMessage']) {
                    BattleManager._logWindow.push('addText', $dataStates[reraise_state].meta['ReraiseMessage'].format(target.name(), $dataStates[reraise_state].name));
                }

                // 回復処理
                if (target._actorId) {
                    $gameActors.actor(target._actorId).gainHp(cure);
                } else {
                    $gameTroop.members()[target.index()].gainHp(cure);
                }
            }
        }
    };
}());
