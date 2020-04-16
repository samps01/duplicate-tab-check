class ValidateTab {
    constructor(expiryDuration, sessionResetInterval) {
        this.expiryDuration = expiryDuration;
        this.sessionResetInterval = sessionResetInterval;
        this.storageType = {
            windowObjStorage: 1,
            cookieStorage: 2
        };
    }

    /**
     * Method to set cookie
     * @param name {String}
     * @param value {String}
     * @param days
     * @private
     */
    _setCookie(name, value, days) {
        let expires = "";
        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    /**
     * Mehod to set the cookie key value
     * @param key {String}
     * @returns {string|null}
     * @private
     */
    _getCookie(key) {
        let keyStr = key + "=";
        let cookieArray = document.cookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookieStr = cookieArray[i];
            while (cookieStr.charAt(0) == ' ') cookieStr = cookieStr.substring(1, cookieStr.length);
            if (cookieStr.indexOf(keyStr) == 0) return cookieStr.substring(keyStr.length, cookieStr.length);
        }
        return null;
    }

    /**
     * Gets window name (Based on each tab window) or cookie value
     * @param storageType {Number}
     * @returns {string}
     * @private
     */
    _getValue(storageType) {
        let value = "";
        if (storageType === this.storageType.windowObjStorage) {
            value = window.name;
        } else if (storageType === this.storageType.cookieStorage) {
            value = decodeURIComponent(this._getCookie('unique-tab-id'));
        }

        if (!value) {
            value = '';
        }
        return value;
    }

    /**
     * Sets window.name or cookie object
     * @param storageType {Number}
     * @param value {String}
     * @private
     */
    _setValue(storageType, value) {
        if (storageType === this.storageType.windowObjStorage) {
            window.name = value;
        } else if (storageType === this.storageType.cookieStorage) {
            this._setCookie('unique-tab-id', value);
        }
    }

    /**
     * wrapper method for window events to set value
     * @param type {String}
     * @param value {String}
     */
    setValue(type, value) {
        if (this.storageType['type']) {
            this._setValue(this.storageType['type'], value);
        }
    }


    /**
     * Created UUID for window.name and cookie
     * @returns {string}
     * @private
     */
    _create_UUID() {
        let dt = new Date().getTime();
        let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        return uuid;
    }


    /**
     * generates new cookie object everytime
     * @param window_uuid {String}
     * @private
     */
    _setCookieObj(window_uuid) {
        console.log(window_uuid);
        let cookieObj = {
            uuid: window_uuid,
            ts: new Date().getTime()
        };
        this._setValue(2, JSON.stringify(cookieObj));
    }

    /**
     * Method which checks if the tab session is unique
     * @returns {boolean}
     */
    validateTabIsUnique() {
        let window_uuid = this._getValue(1) || this._create_UUID();
        this._setValue(this.storageType.windowObjStorage, window_uuid);

        let cookieData = this._getValue(2);
        let cookieObj = (cookieData === "" ? null : JSON.parse(cookieData)) || null;
        if (cookieObj === null || (cookieObj.ts < (new Date().getTime() - this.expiryDuration)) || cookieObj.uuid === window_uuid) {
            this._setCookieObj(window_uuid);
            setInterval(() => this._setCookieObj(window_uuid), this.sessionResetInterval);
            return true;
        } else {
            return false;
        }
    }

}


/**
 * Optional code.. can modify based on usage
 * @returns {boolean}
 * @constructor
 */
window.checkTabStatus = function () {
    let tabValidate = new ValidateTab(5000, 1000); // 5 sec expiry window & 1 sec interval to set UUID
    let uniqueTab = tabValidate.validateTabIsUnique();
    console.log("Is unique: "+ uniqueTab);
    if (!uniqueTab) {
        let html = document.querySelector('html');
        html.innerHTML = 'Duplicate Tab';
    }

    window.addEventListener('unload', function () {
       tabValidate.setValue('cookieStorage', "");
    });

    window.addEventListener("beforeunload", function () {
        if (uniqueTab == true) {
            tabValidate.setValue('cookieStorage', "");
        }
    });

    return uniqueTab;
};


window.checkTabStatus();