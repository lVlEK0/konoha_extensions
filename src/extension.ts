'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, OutputChannel, Range} from 'vscode';
import * as child_process from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "wordcount" is now active!');

    var outputChannel = window.createOutputChannel("konoha5");

    // WordCounterインスタンス生成
    let codeInfo = new CodeInfo();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = commands.registerCommand('extension.interpreterKonoha5', () => {
    
        window.showInformationMessage('Konoha5 Interpreter!');

        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(_onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(_onEvent, this, subscriptions);

        let p = child_process.exec('origami konoha ',(error, stdout, stderror) => {
            outputChannel.appendLine(stdout.toString());
            outputChannel.appendLine(stderror.toString());
        });

        p.stdin.write(codeInfo.getNew(), 'utf8');

        function _onEvent() {
            //console.log(codeInfo.getNew());
            p.stdin.write(codeInfo.getNew(), 'utf8');
        }

        let buf = ``;
        
        p.stdout.on('data', function(data) {
            buf += data.toString();
            let index = buf.indexOf('\n');
            if(index > -1){
                buf = buf.replace(/\[00;..m/,"[00m");
                outputChannel.append(buf);
                buf = '';
            }
        });
    });

    let run_konoha5 = commands.registerCommand('extension.runKonoha5', () => {
        
            window.showInformationMessage('Konoha5 Run!');

            outputChannel.clear();

            let origamiCommand = 'origami konoha ';

            let textData = codeInfo.getCode();
            let pass = textData.uri.path;
    
            let p = child_process.exec(origamiCommand + pass, (error, stdout, stderror) => {});
    
            //p.stdin.write(code, 'utf8');
    
            let buf = ``;
            
            p.stdout.on('data', function(data) {
                buf += data.toString();
                let index = buf.indexOf('\n');
                let interpreterIndex = buf.indexOf('Konoha🍃');
                if(index > -1 && interpreterIndex == -1){
                    outputChannel.append(buf);
                    buf = '';
                }
            });
        });

    // WordCounterControllerインスタンス生成
    let controller = new WordCounterController(codeInfo, outputChannel);

    // WordCounterとWordCounterControllerのリソース開放
    context.subscriptions.push(controller);
    context.subscriptions.push(codeInfo);
    context.subscriptions.push(disposable);
    context.subscriptions.push(run_konoha5);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

// WordCounterクラス宣言
class CodeInfo {

    // ステータスバー保存用のprivate変数定義
    private _statusBarItem: StatusBarItem;

    private pos: number = 0;
    private oldCode: string = "";

    public getNew(): String {
        if (!this._statusBarItem) {
            // ステータスバー(左揃え)のリソースを取得。
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // アクティブなエディタを取得
        let editor = window.activeTextEditor;
        if (!editor) {
            // 見つからない場合は,ステータスバーを非表示にして,何もしないでreturn。
            this._statusBarItem.hide();
            return;
        }

        // エディタ内のドキュメントを取得
        //let code = editor.document.getText();
        //code = code.substr(this.pos);
        //this.pos = code.length + this.pos;
        //console.log(this.pos);

        let code = editor.document.getText();
        let newCode = code;
        code = code.replace(this.oldCode,"");
        this.oldCode = newCode;

        return code;
    }

    public getCode(): TextDocument {
        if (!this._statusBarItem) {
            // ステータスバー(左揃え)のリソースを取得。
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // アクティブなエディタを取得
        let editor = window.activeTextEditor;
        if (!editor) {
            // 見つからない場合は,ステータスバーを非表示にして,何もしないでreturn。
            this._statusBarItem.hide();
            return;
        }

        // エディタ内のドキュメントを取得
        //let code = editor.document.getText();
        //let line = editor.document.lineCount;

        return editor.document;
    }

    public updataWorkSpace(outputChannel: OutputChannel) {
        let origamiCommand = 'origami konoha ';
        let textData = this.getCode();

        if (textData.languageId == "konoha5"){
            let pass = textData.uri.path;
            let p = child_process.exec(origamiCommand + pass,(error, stdout, stderror) => {});
        
            let buf:string = ``;
    
            outputChannel.clear();
            p.stdout.on('data', function(data) {
                buf += data.toString();
                let index = buf.indexOf('\n');
                let interpreterIndex = buf.indexOf('Konoha🍃');
                if(index > -1 && interpreterIndex == -1 ){
                    buf = buf.replace(/\[00;..m/,"[00m");
                    outputChannel.append(buf);
                    buf = '';
                    }
                });
        }
    }

    public updateWordCounter() {
        if (!this._statusBarItem) {
            // ステータスバー(左揃え)のリソースを取得。
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        // アクティブなエディタを取得
        let editor = window.activeTextEditor;
        if (!editor) {
            // 見つからない場合は,ステータスバーを非表示にして,何もしないでreturn。
            this._statusBarItem.hide();
            return;
        }

        // エディタ内のドキュメントを取得
        let doc = editor.document;

        //console.log(doc.uri.path);

        if (doc.languageId == "konoha5") {
            // 「.md」 のMarkdownの場合に,単語をカウントする(_getWordCount)呼び出し。
            let wordCount = this._getWordCount(doc);

            // 単語の数をステータスバーに設定して,ステータスバーを表示する。
            this._statusBarItem.text = wordCount !== 1 ? `$(pencil) ${wordCount} Words` : `$(pencil) 1 Word`;
            this._statusBarItem.show();

        } else {
            // Markdown以外は,ステータスバーを非表示にする。
            this._statusBarItem.hide();
        }
    }

    // 単語の数を取得する。
    public _getWordCount(doc: TextDocument): number {
        // ドキュメント内のテキストを取得
        let docContext = doc.getText();

        //テキストの先頭と最後の2文字以上の空白を削除
        docContext = docContext.replace(/^\s\s*/, ` `).replace(/^\s\s*/, ` `);

        let wordCount = 0;
        if (docContext != "") {
            // スペースで分解して,分割された数を取得
            wordCount = docContext.split(" ").length;
        }

        return wordCount;
    }

    // リソース開放用の関数を追加
    dispose() {
        // ステータスバーのリソースを開放。
        this._statusBarItem.dispose();
    }

}

class WordCounterController {
    private _wordCounter: CodeInfo;
    private _disposable: Disposable;
    private _outputChannel: OutputChannel;

    constructor(wordCounter: CodeInfo, outputChannel: OutputChannel) {
        this._wordCounter = wordCounter;
        this._outputChannel = outputChannel;
        this._wordCounter.updateWordCounter();
        this._wordCounter.updataWorkSpace(this._outputChannel);

        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent2, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        workspace.onDidSaveTextDocument(this._onEvent, this, subscriptions);
        // update the counter for the current file
        // コメントは,上のようになっているが,この部分は,よくわからない。初めに呼んでいるが,なぜ,二回呼ぶのか。
        this._wordCounter.updateWordCounter();

        this._disposable = Disposable.from(...subscriptions);
    }

    dispose() {
        this._disposable.dispose();
    }

    private _onEvent() {
        this._wordCounter.updateWordCounter();
        this._wordCounter.updataWorkSpace(this._outputChannel);
    }

    private _onEvent2() {
        this._wordCounter.updateWordCounter();
        //this._wordCounter.updataWorkSpace();
    }

}