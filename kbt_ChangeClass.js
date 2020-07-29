//=============================================================================
// kbt_ChangeClass
// クラスチェンジ機能を設定するプラグインです。
// Last Updated: 2020.07.29
//
// Copyright (c) 2020 小鳩箱
// Released under the MIT license
// https://opensource.org/licenses/mit-license.php
//=============================================================================

/*:
 * @plugindesc ver1.01/クラスチェンジ機能を設定するプラグインです。
 * @author 小鳩箱
 * 
 * @param IsShare
 * @desc クラスチェンジを行った際、レベルを共有するか、クラスごとにレベルを保持するかを設定します。
 * @type select
 * 
 * @option レベルを共有
 * @value 1
 * 
 * @option レベルは個別
 * @value 2
 * 
 * @default 1
 * 
 * @param IsForget
 * @desc クラスチェンジを行った際、前のクラスで覚えていたスキルを忘れるか保持するかを設定します。
 * @type select
 * 
 * @option スキルは覚えたまま
 * @value 1
 * 
 * @option スキルを忘却する
 * @value 2
 * 
 * @default 1
 * 
 * @param IsRecovery
 * @desc クラスチェンジを行った際、HPとMPを回復させるかどうかを設定します。
 * @type select
 * 
 * @option HPとMPを回復する
 * @value 1
 * 
 * @option HPとMPを回復しない
 * @value 2
 * 
 * @default 1
 * 
 * @param Message1
 * @desc 職業選択時に表示するメッセージを設定します。空白の場合は省略されます。
 * @type string
 * @default 転職する職業を選択してください
 *
 * @param Message2
 * @desc 職業完了時に表示するメッセージを設定します。空白の場合は省略されます。
 * @type string
 * @default 転職が完了しました
 * 
 * @param CancelText
 * @desc 職業選択時に「キャンセル」の代わりに表示する文字を設定します。省略した場合は「キャンセル」になります。
 * @type string
 * @default キャンセル
 * 
 * @param CancelMessage
 * @desc 職業選択をキャンセルした場合に表示するメッセージを設定します。空白の場合は省略されます。
 * @type string
 * @default キャンセルされました
 *
 * @help
 * アクターを複数の職業スに対応させるプラグインです。
 *
 * アクターのメモ欄に、以下のように記載してください。
 *  <ClassList:[職業ID],[職業ID],...>
 *
 * 例：以下のように設定すると、職業ID=1と職業ID=2に転職できるようになります。
 *  <ClassList:1,2>
 *
 *
 * 職業のメモ欄に、以下のように記載すると、指定されたスイッチがOFFの場合に選択肢から除外します。
 *  <ClassListHiddenSwith:[スイッチID]>
 *
 * 例：以下のように設定すると、スイッチ1がONになるまで、選択肢に表示されなくなります。
 *  <ClassListHiddenSwith:1>
 *
 * プラグインコマンド
 *
 * ■アクターと職業を直接指定する場合
 *
 * ChangeClass change [アクターID] [職業ID]
 *  指定されたアクターと職業で転職処理を行います。
 *
 * 例：アクターID=1のアクターを、職業ID=5に転職させる場合
 * プラグインコマンド：ChangeClass change 1 5
 * 
 *
 * ■アクターごとに転職可能なリストを表示し、転職先を選択する場合
 *
 * ChangeClass list [アクターID]
 *  アクターの転職可能リストを選択肢で表示します。
 *
 * ChangeClass select [アクターID]
 *  選択肢を元に、転職処理を行います。ChangeClassListと続けて使用してください。
 *
 * 使い方：以下のように、連続してプラグインコマンドを設定してください。
 * アクターID=1の転職を行う場合の例です。
 * 
 * プラグインコマンド：ChangeClass list 1
 * プラグインコマンド：ChangeClass select 1
 */

function Game_ClassLevel(){
    this.initialize.apply(this, arguments);
}
function Game_ClassLevelList(){
    this.initialize.apply(this, arguments);
}

(function() {
    'use strict';

    var parameters = PluginManager.parameters('kbt_ChangeClass');
    var IsShare = Number(parameters['IsShare']);
    var IsForget = Number(parameters['IsForget']);
    var IsRecovery = Number(parameters['IsRecovery']);
    var Message1 = parameters['Message1'];
    var Message2 = parameters['Message2'];
    var CancelText = parameters['CancelText'];
    var CancelMessage = parameters['CancelMessage'];

    //=============================================================================
    // プラグインコマンド
    //=============================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'ChangeClass') {
            var act = args[0];
            var num = Number(args[1]);
            if (!isNaN(num) && num > 0) {
                switch (act) {
                    case 'list':
                        ChangeClassList(num, this);
                        break;
                    case 'select':
                        ChangeClassSelect(num, this);
                        break;
                    case 'change':
                        var num2 = Number(args[2]);
                        if (!isNaN(num2) && num2 > 0) {
                            ChangeClass(num, num2)
                        }
                        break;
                }
            }
        }
    };

    //=============================================================================
    // クラス一覧取得
    //=============================================================================
    function ChangeClassList(actorId, messageClass) {
        var actor = $dataActors[actorId];
        var classIdList = actor.meta['ClassList'].split(',');

        var selectList = [];
        classIdList.forEach( function(classId) {
            if ($gameActors.actor(actorId)._classId != classId) {
                var classData = $dataClasses[classId];
                var ishiddenFlg = Number(classData.meta['ClassListHiddenSwith']);
                if (isNaN(ishiddenFlg) || (!isNaN(ishiddenFlg) && $gameSwitches.value(ishiddenFlg))) {
                    selectList.push(classData.name);
                }
            }
        });
        if (CancelText != '') {
            selectList.push(CancelText);
        } else {
            selectList.push('キャンセル');
        }

        messageClass.setupChoices([selectList,(selectList.length - 1),0,2,0]);
        messageClass.setWaitMode('message');
        if (Message1 != '') {
            $gameMessage.add(Message1);
        }
    }

    //=============================================================================
    // 選択肢からクラス変更
    //=============================================================================
    function ChangeClassSelect(actorId, messageClass) {
        var actor = $dataActors[actorId];
        var classIdList = actor.meta['ClassList'].split(',');

        var classList = [];
        classIdList.forEach( function(classId) {
            if ($gameActors.actor(actorId)._classId != classId) {
                var classData = $dataClasses[classId];
                var ishiddenFlg = Number(classData.meta['ClassListHiddenSwith']);
                if (isNaN(ishiddenFlg) || (!isNaN(ishiddenFlg) && $gameSwitches.value(ishiddenFlg))) {
                    classList.push(classData);
                }
            }
        });
        
        var classId = messageClass._branch[messageClass._indent];
        
        if (classId >= 0 && classId < classList.length) {
            // 転職処理
            ChangeClass(actorId, classList[classId].id);

            // 転職完了
            if (Message2 != '') {
                $gameMessage.add(Message2);
            }
        } else {
            // キャンセル
            if (CancelMessage != '') {
                $gameMessage.add(CancelMessage);
            }
        }
    }

    //=============================================================================
    // クラス変更とスキル習得および忘却
    //=============================================================================
    function ChangeClass(actorId, classId) {
        var actor = $dataActors[actorId];

        // スキルの忘却
        if (IsForget == 2) {
            // 忘却する
            $dataClasses[$gameActors.actor(actorId)._classId].learnings.forEach(function(learning) {
                $gameActors.actor(actorId).forgetSkill(learning.skillId);
            });
        }

        // 職業を変更
        if (IsShare == 1) {
            // レベルを共有
            $gameActors.actor(actorId).changeClass(classId, true);
        } else {
            // レベルは独立
            $gameActors.actor(actorId).changeClass(classId, false)
        }

        // 現在レベル以下のスキルを習得
        $dataClasses[$gameActors.actor(actorId)._classId].learnings.forEach(function(learning) {
            if (learning.level <= $gameActors.actor(actorId)._level) {
                $gameActors.actor(actorId).learnSkill(learning.skillId);
            }
        });

        if (IsRecovery == 1) {
            // HP回復
            $gameActors.actor(actorId).gainHp(9999, false);

            // MP回復
            $gameActors.actor(actorId).gainMp(9999);
        }
    }
    
})();
