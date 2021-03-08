//=============================================================================
// kbt_CriticalDamage
// クリティカルヒット時のダメージ倍率を変更するプラグインです。
// Last Updated: 2019.01.05
//
// Copyright (c) 2019 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/クリティカルヒット時のダメージ倍率を変更するプラグインです。
 * @author 小鳩箱
 * 
 * @param CriticalBonus
 * @type number
 * @desc クリティカルヒットした際のダメージ倍率を指定します。正の実数を指定してください。
 * @default 1.5
 *
 * @help
 * 攻撃がクリティカルヒットした際、ダメージの増加率を変更するプラグインです。
 * 他にクリティカルヒット時の動作を変更するプラグインを入れている場合、競合する可能性があります。
 *
 * スキルごとにクリティカルヒット時のダメージ増加率を設定したい場合は、
 * 使用するスキルのメモ欄に、以下のように記載してください。
 * 数値は正の実数を指定してください。
 *  <CriticalD:[倍率]>
 *
 * 例：以下のように設定すると、そのスキルでクリティカルヒットが発生した場合にダメージが2.5倍になります。
 *  <CriticalD:2.5>
 */

(function() {
  var parameters = PluginManager.parameters('kbt_CriticalDamage');
  var CriticalBonus = Number(parameters['CriticalBonus']);

  var _Game_Action_applyCritical = Game_Action.prototype.applyCritical;
  Game_Action.prototype.applyCritical = function(damage) {
    damage = _Game_Action_applyCritical.call(this, damage);
    var item = this.item();
    var CriticalBonusOfSkill = item.meta['CriticalD'];

    // ツクール仕様のクリティカルダメージは3倍なので、3で割ってから設定した倍率を掛ける。
    if (!CriticalBonusOfSkill) {
      return (damage / 3) * CriticalBonus;
    } else {
      return (damage / 3) * Number(CriticalBonusOfSkill);
    }
  };
})();
