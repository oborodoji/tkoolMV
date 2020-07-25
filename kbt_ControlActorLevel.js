//=============================================================================
// kbt_ControlActorLevel
// レベル操作に関する機能の詰め合わせプラグインです。
// Last Updated: 2020.07.25
//
// Copyright (c) 2020 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.00/レベル操作に関する機能の詰め合わせプラグインです。
 * @author 小鳩箱
 * 
 * @param RecoverType
 * @desc レベル変更時の回復処理を設定します。
 * @type select
 * 
 * @option 全回復
 * @value 1
 * 
 * @option 戦闘不能解除、HPとMPを9999回復
 * @value 2
 * 
 * @option 回復処理を行わない
 * @value 3
 * 
 * @default 1
 *
 * @help
 * アクターのレベル操作ができるようになるプラグインです
 *
 * プラグインコマンド
 * 
 * LevelChangeAll (上下させるレベル)
 *  アクター全員のレベルを、指定された数値で上下させます。
 *  例：LevelChangeAll 5
 *      レベル5のアクターはレベル10に、レベル15のアクターはレベル20になります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 *
 * LevelChangeParty (上下させるレベル)
 *  パーティメンバー全員のレベルを、指定された数値で上下させます。
 *  例：LevelChangeParty -5
 *      レベル5のアクターはレベル1に、レベル15のアクターはレベル10になります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 * 
 * LevelSetAll (再設定するレベル)
 *  アクター全員のレベルを、指定された数値に設定し直します。
 *  例：LevelSetAll 10
 *      元のレベルに関わらず、すべてのアクターがレベル10になります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 * 
 * LevelSetParty (再設定するレベル)
 *  パーティメンバー全員のレベルを、指定された数値に設定し直します。
 *  例：LevelSetParty 1
 *      元のレベルに関わらず、パーティメンバー全員がレベル1になります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 * 
 * LevelSetAve (レベルを変更するアクターID)
 *  指定したアクターのレベルを、パーティメンバーの平均レベルに設定し直します。
 *  例：LevelSetAve 1
 *      アクターID=1のキャラクターのレベルをパーティの平均値に設定します。
 *      パーティメンバーのレベルが5,10,15,1の場合、8レベルになります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 * 
 * LevelSetMax (レベルを変更するアクターID)
 *  指定したアクターのレベルを、パーティメンバーの最大レベルに設定し直します。
 *  例：LevelSetMax 1
 *      アクターID=1のキャラクターのレベルをパーティの最大値に設定します。
 *      パーティメンバーのレベルが5,10,15,1の場合、15レベルになります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 * 
 * LevelSetMin (レベルを変更するアクターID)
 *  指定したアクターのレベルを、パーティメンバーの最小レベルに設定し直します。
 *  例：LevelSetMin 1
 *      アクターID=1のキャラクターのレベルをパーティの最小値に設定します。
 *      パーティメンバーのレベルが5,10,15,1の場合、1レベルになります。
 *      レベルを下げた場合、新しいレベルより上で習得するスキルは忘却します。
 */

(function() {
    var parameters = PluginManager.parameters('kbt_ControlActorLevel');
    var RecoverType = Number(parameters['RecoverType']);

    //=============================================================================
    // プラグインコマンド
    //=============================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'LevelChangeAll') {
            var num = Number(args[0]);
            if (!isNaN(num) && num >= -999 && num <= 999) {
                changeLevelAll(num);
            }
        }
        if (command === 'LevelSetAll') {
            var num = Number(args[0]);
            if (!isNaN(num) && num > 0 && num <= 999) {
                setLevelAll(num);
            }
        }
        if (command === 'LevelChangeParty') {
            var num = Number(args[0]);
            if (!isNaN(num) && num >= -999 && num <= 999) {
                changeLevelParty(num);
            }
        }
        if (command === 'LevelSetParty') {
            var num = Number(args[0]);
            if (!isNaN(num) && num > 0 && num <= 999) {
                setLevelParty(num);
            }
        }
        if (command === 'LevelSetAve') {
            var num = Number(args[0]);
            if (!isNaN(num) && num > 0) {
                setLevelAve(num);
            }
        }
        if (command === 'LevelSetMax') {
            var num = Number(args[0]);
            if (!isNaN(num) && num > 0) {
                setLevelMax(num);
            }
        }
        if (command === 'LevelSetMin') {
            var num = Number(args[0]);
            if (!isNaN(num) && num > 0) {
                setLevelMin(num);
            }
        }
    };


    //=============================================================================
    // 共通処理
    //=============================================================================
    // レベルとスキルのリセット
    function refreshActor(actorId, level) {
        var actor = $gameActors.actor(actorId);
            
        // アクターのレベルをリセット
        actor.changeLevel(level, false);
            
        // アクターのスキルリストを取得して忘却
        $dataClasses[actor._classId].learnings.forEach(function(learning) {
            // 習得レベルが変更後より大きいスキルは忘却
            if (learning.level > level) {
                actor.forgetSkill(learning.skillId);
            }
        });

    };

    // 全回復
    function recoverActor(actorId) {
        var actor = $gameActors.actor(actorId);

        if (RecoverType === 1) {
            // 全回復
            actor.recoverAll();
        } else if (RecoverType === 2) {
            // 戦闘不能解除
            actor.removeState(1);

            // HP回復
            actor.gainHp(9999, false);

            // MP回復
            actor.gainMp(9999);
        }
    };

    function recoverAllActor() {
        // 全アクター分の処理を行う
        for (var i = 1; i < $dataActors.length; i++) {
            recoverActor(i);
        }
    };

    function recoverPartyActor() {
        // パーティにいるアクター分の処理を行う
        for (var i = 0; i < $gameParty.members().length; i++) {
            recoverActor($gameParty.members()[i]._actorId);
        }
    };


    //=============================================================================
    // レベルアップ、レベルダウン
    //=============================================================================
    // 全アクター
    function changeLevelAll(level) {
        // 全アクターのレベルを計算してリセット
        for (var i = 1; i < $dataActors.length; i++) {
            var newLevel = Math.max(1, ($gameActors.actor(i)._level + level));
            refreshActor(i, newLevel);
        }

        // 全回復
        recoverAllActor();
    };

    // バーティメンバー
    function changeLevelParty(level) {
        // パーティにいるアクターのレベルを計算してリセット
        for (var i = 0; i < $gameParty.members().length; i++) {
            var actorId = $gameParty.members()[i]._actorId;
            var newLevel = Math.max(1, ($gameActors.actor(actorId)._level + level));
            refreshActor(actorId, newLevel);
        }

        // 全回復
        recoverPartyActor();
    };

    //=============================================================================
    // レベル再設定
    //=============================================================================
    // 全アクター
    function setLevelAll(level) {
        // 全アクターのレベルと習得スキルをリセット
        for (var i = 1; i < $dataActors.length; i++) {
            refreshActor(i, level);
        }

        // 全回復
        recoverAllActor();
    };

    // バーティメンバー
    function setLevelParty(level) {
        // パーティにいるアクターのレベルと習得スキルをリセット
        for (var i = 0; i < $gameParty.members().length; i++) {
            var actorId = $gameParty.members()[i]._actorId;
            refreshActor(actorId, level);
        }

        // 全回復
        recoverPartyActor();
    };

    //=============================================================================
    // パーティレベルに合わせて変更
    //=============================================================================
    // 平均値
    function setLevelAve(actorId) {
        var level = 0;
        var i;
        for (i = 0; i < $gameParty.members().length; i++) {
            var actor = $gameParty.members()[i]._actorId;
            level += $gameActors.actor(actor)._level;
        }
        refreshActor(actorId, Math.round(level / i));
        recoverActor(actorId);
    };

    // 最大値
    function setLevelMax(actorId) {
        var level = [];
        for (var i = 0; i < $gameParty.members().length; i++) {
            var actor = $gameParty.members()[i]._actorId;
            level.push($gameActors.actor(actor)._level);
        }
        refreshActor(actorId, Math.max.apply(null, level));
        recoverActor(actorId);
    };

    // 最小値
    function setLevelMin(actorId) {
        var level = [];
        for (var i = 0; i < $gameParty.members().length; i++) {
            var actor = $gameParty.members()[i]._actorId;
            level.push($gameActors.actor(actor)._level);
        }
        refreshActor(actorId, Math.min.apply(null, level));
        recoverActor(actorId);
    };
})();
