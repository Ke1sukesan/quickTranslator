
'use strict';

class Background {
  itemIds;
  languageCode;
  openingMethod;
  targetText;
  targetWeb;
  service;
  windowFlag;
  windowHeight;
  windowWidth;
  url;

  constructor() {
    this.languageCode  = 'en';
    this.openingMethod = 'tab';
    this.targetText    = '';
    this.targetWeb     = 'https://';
    this.service       = 'google';
    this.flagKey       = false;
    this.windowWidth   = '0';
    this.windowHeight  = '0';
    this.url           = '';

    this.itemIds = {
      text: 'idTranslateText',
      web:  'idTranslateWebpage'
    }
  }

  exceptionLog( error ) {
    console.log( 'Catched an exception: ' + error.message );
  }

  getitemIds() {
    return this.itemIds;
  }

  menusItem( contextType, itemId, title ) {
    browser.menus.create({
      contexts: [contextType],
      id:       itemId,
      title:    browser.i18n.getMessage( title )
    });
  }

  prepareMenusOnclicked() {
    browser.menus.onClicked.addListener( async ( info ) => {
      await Promise.all([
        this.languageCodeSetup( 'languageCode' ),
        this.serviceSetup( 'translationService' ),
        this.windowSizeSetup( 'specifySizeFlag', 'sizeWidth', 'sizeHeight' )
      ])
      .catch( ( error ) => this.exceptionLog( error ) );
      switch ( info.menuItemId ) {
        case this.itemIds.text:
          await Promise.all([
            this.openingMethodSetup( 'openMethodText' ),
            this.targetTextSetup( info.selectionText )
          ])
          .catch( ( error ) => this.exceptionLog( error ) );
          await this.urlAssemblingText()
          .catch( ( error ) => this.exceptionLog( error ) );
          break;
        case this.itemIds.web:
          await Promise.all([
            this.openingMethodSetup( 'openMethodWebpage' ),
            this.targetWebSetup( info.pageUrl )
          ])
          .catch( ( error ) => this.exceptionLog( error ) );
          await this.urlAssemblingWeb()
          .catch( ( error ) => this.exceptionLog( error ) );
          break;
      }
      this.urlOpen();
    });
  }

  prepareBrowserActionOnclicked() {
    browser.browserAction.onClicked.addListener( async ( tab ) => {
      await Promise.all([
        this.languageCodeSetup( 'languageCode' ),
        this.openingMethodSetup( 'openMethodWebpage' ),
        this.targetWebSetup( tab.url ),
        this.serviceSetup( 'translationService' ),
        this.windowSizeSetup( 'specifySizeFlag', 'sizeWidth', 'sizeHeight' )
      ])
      .catch( ( error ) => this.exceptionLog( error ) );
      await this.urlAssemblingWeb()
      .catch( ( error ) => this.exceptionLog( error ) );
      this.urlOpen();
    });
  }

  async languageCodeSetup( key ) {
    try {
      const object = await browser.storage.local.get( key );
      if ( object[key] == 'auto' || object[key] == undefined ) {
        object[key]  = browser.i18n.getUILanguage();
      }
      const fixCodes = [ 'de', 'en', 'es', 'pt' ];
      fixCodes.forEach( code => {
        object[key] = ( object[key].indexOf( code ) != -1 ) ? code : object[key];
      });
      this.languageCode = object[key];
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  async openingMethodSetup( key ) {
    try {
      const object       = await browser.storage.local.get( key );
      this.openingMethod = object[key] ?? 'tab';
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  async serviceSetup( key ) {
    try {
      const object = await browser.storage.local.get( key );
      this.service = object[key] ?? 'google';
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  async windowSizeSetup( flagKey, widthKey, heightKey ) {
    try {
      const object      = await browser.storage.local.get([ flagKey, widthKey, heightKey ]);
      this.windowFlag   = object[flagKey]   ?? false;
      this.windowWidth  = object[widthKey]  ?? 800;
      this.windowHeight = object[heightKey] ?? 720;
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  async targetTextSetup( text ) {
    try {
      text.replaceAll( /\%/g, '％' )
        .replaceAll( /\"/g, '%22' )
          .replaceAll( /\&/g, '%26' )
            .replaceAll( /\'/g, '%27' )
              .replaceAll( /\</g, '%3C' )
                .replaceAll( /\>/g, '%3E' );
      this.targetText = text;
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  async targetWebSetup( url ) {
    try {
      url.replace( /\"/g, '%22' )
        .replace( /\</g, '%3C' )
          .replace( /\>/g, '%3E' );
      this.targetWeb = url;
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  async urlAssemblingText() {
    try {
      switch ( this.service ) {
        case 'google':
          this.url = 'https://translate.google.com/?sl=auto&tl='+this.languageCode+'&text='+this.targetText+'&op=translate';
          break;
        case 'microsoft':
          this.url = 'https://www.bing.com/translator?from=&to='+this.languageCode+'&text='+this.targetText;
          break;
      }
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false; 
    }
  }

  async urlAssemblingWeb() {
    try {
      switch ( this.service ) {
        case 'google':
          this.url = 'https://translate.google.com/translate?hl='+this.languageCode+'&sl=auto&tl='+this.languageCode+'&u='+this.targetWeb;
          break;
        case 'microsoft':
          this.url = 'https://www.translatetheweb.com/?from=&to='+this.languageCode+'&a='+this.targetWeb;
          break;
      }
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }

  urlOpen() {
    try {
      switch ( this.openingMethod ) {
        case 'tab':
          browser.tabs.create({
            url: this.url
          });
          break;
        case 'window':
          if ( this.windowFlag == true ) {
            browser.windows.create({
              url: this.url, width: this.windowWidth, height: this.windowHeight
            });
          } else {
            browser.windows.create({
              url: this.url
            });
          }
          break;
      }
      return true;
    } catch ( error ) {
      this.exceptionLog( error );
      return false;
    }
  }
}

const BackgroundIns = new Background();
BackgroundIns.menusItem( 'selection', BackgroundIns.getitemIds().text, 'contextTranslateSelectedText' );
BackgroundIns.menusItem( 'page', BackgroundIns.getitemIds().web, 'contextTranslateThisWebpage' );
BackgroundIns.prepareBrowserActionOnclicked();
BackgroundIns.prepareMenusOnclicked();

