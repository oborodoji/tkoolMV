//=============================================================================
// kbt_AutoResurrection
// ターン終了時、戦闘不能になっていると確率で蘇生するスキルを設定するプラグインです。
// Last Updated: 2019.07.20
//
// Copyright (c) 2019 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/ターン終了時、戦闘不能になっていると確率で蘇生するスキルを設定するプラグインです。
 * @author 小鳩箱
 * 
 * @help
 * ターン終了時、戦闘不能状態になっていると確率で蘇生するスキルを設定するためのプラグインです。
 * スキルのメモ欄に、以下のように記述してください。両方の記述が必要です。
 * 確率は正の整数で指定してください。
 *
 *  <ResurrectionCure:[回復量（％）]>
 *  <ResurrectionRate:[発動率（％）]>
 *
 * 例1：ターン終了時、必ずHP1で蘇生するスキル
 *  <ResurrectionCure:0>
 *  <ResurrectionRate:100>
 *
 * 例2：ターン終了時、10%の確率でHPを全回復し蘇生するスキル
 *  <ResurrectionCure:100>
 *  <ResurrectionRate:10>
 */

(function() {
    'use strict';

    var _Game_Battler_prototype_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_prototype_onTurnEnd.call(this);
        var resurrection_cure = 0;
        var resurrection_rate = 0;
        var resurrection_act = false;
        var resurrection_skill = 0;
        var resurrection_value = 0;

        if (this._hp === 0 && this._skills) {
            this._skills.forEach(function(skill) {
                if ($dataSkills[skill].meta['ResurrectionCure'] && $dataSkills[skill].meta['ResurrectionRate'] && !resurrection_act) {
                    resurrection_cure = Math.max(resurrection_cure, $dataSkills[skill].meta['ResurrectionCure']);
                    resurrection_rate = Math.max(resurrection_rate, $dataSkills[skill].meta['ResurrectionRate']);

                    if (Math.floor(Math.random() * 100) <= resurrection_rate) {
                        resurrection_skill = skill;
                        resurrection_act = true;
                    }
                }
            });
        }

        // 蘇生
        if (resurrection_act) {
            BattleManager._logWindow.displayAction(this, $dataSkills[resurrection_skill],this);
            resurrection_value = Math.floor(this.mhp * resurrection_cure / 100) + 1;
            $gameActors.actor(this._actorId).gainHp(resurrection_value);
        }
    };
})();
