﻿// "zoom_to" plugin, main module

require({
    // Specify library locations.
    packages: [
        {
            name: "jquery",
            location: "//ajax.googleapis.com/ajax/libs/jquery/1.9.0",
            main: "jquery.min"
        }
    ]
});

define(
    ["dojo/_base/declare",
     "framework/PluginBase",
     "./ui", 
     "dojo/text!plugins/zoom_to/zoom_to.json",
     "jquery"
    ],
    function (declare, PluginBase, ui, configString, $) {

// Had trouble getting jquery-jsonp to load using AMD.
// Because jquery-jsonp is executed on jquery, rather
// than being "used" like another module they both
// need to be loaded using the same method. This is a
// workaround to execute the source of jquery-jsonp in a
// require block and modify jquery here.

// jquery.jsonp 2.4.0 (c)2012 Julian Aubourg | MIT License
// https://github.com/jaubourg/jquery-jsonp
(function(e){function t(){}function n(e){C=[e]}function r(e,t,n){return e&&e.apply&&e.apply(t.context||t,n)}function i(e){return/\?/.test(e)?"&":"?"}function O(c){function Y(e){z++||(W(),j&&(T[I]={s:[e]}),D&&(e=D.apply(c,[e])),r(O,c,[e,b,c]),r(_,c,[c,b]))}function Z(e){z++||(W(),j&&e!=w&&(T[I]=e),r(M,c,[c,e]),r(_,c,[c,e]))}c=e.extend({},k,c);var O=c.success,M=c.error,_=c.complete,D=c.dataFilter,P=c.callbackParameter,H=c.callback,B=c.cache,j=c.pageCache,F=c.charset,I=c.url,q=c.data,R=c.timeout,U,z=0,W=t,X,V,J,K,Q,G;return S&&S(function(e){e.done(O).fail(M),O=e.resolve,M=e.reject}).promise(c),c.abort=function(){!(z++)&&W()},r(c.beforeSend,c,[c])===!1||z?c:(I=I||u,q=q?typeof q=="string"?q:e.param(q,c.traditional):u,I+=q?i(I)+q:u,P&&(I+=i(I)+encodeURIComponent(P)+"=?"),!B&&!j&&(I+=i(I)+"_"+(new Date).getTime()+"="),I=I.replace(/=\?(&|$)/,"="+H+"$1"),j&&(U=T[I])?U.s?Y(U.s[0]):Z(U):(E[H]=n,K=e(y)[0],K.id=l+N++,F&&(K[o]=F),L&&L.version()<11.6?(Q=e(y)[0]).text="document.getElementById('"+K.id+"')."+p+"()":K[s]=s,A&&(K.htmlFor=K.id,K.event=h),K[d]=K[p]=K[v]=function(e){if(!K[m]||!/i/.test(K[m])){try{K[h]&&K[h]()}catch(t){}e=C,C=0,e?Y(e[0]):Z(a)}},K.src=I,W=function(e){G&&clearTimeout(G),K[v]=K[d]=K[p]=null,x[g](K),Q&&x[g](Q)},x[f](K,J=x.firstChild),Q&&x[f](Q,J),G=R>0&&setTimeout(function(){Z(w)},R)),c)}var s="async",o="charset",u="",a="error",f="insertBefore",l="_jqjsp",c="on",h=c+"click",p=c+a,d=c+"load",v=c+"readystatechange",m="readyState",g="removeChild",y="<script>",b="success",w="timeout",E=window,S=e.Deferred,x=e("head")[0]||document.documentElement,T={},N=0,C,k={callback:l,url:location.href},L=E.opera,A=!!e("<div>").html("<!--[if IE]><i><![endif]-->").find("i").length;O.setup=function(t){e.extend(k,t)},e.jsonp=O})($)

        return declare(PluginBase, {
            toolbarName: "Zoom To",
            fullName: "Zoom to a specific address.",
            toolbarType: "maptop",

            _initializeViews: function () {
                this.input = this.input || new ui.UiInput();
                this.inputView = this.inputView || new ui.UiInputView({ model: this.input });
            },
            
            initialize: function (args) {
                var spatialReference = new esri.SpatialReference({ wkid: 4326 /* lat-lng */ }),
                    point = function (x, y) { return new esri.geometry.Point(x, y, spatialReference); };

                declare.safeMixin(this, args);
                this.config = JSON.parse(configString);
                if (!this.input) this._initializeViews();
                this.input.setupLocator(this.config.locatorServiceUrl,
                                        this.app._unsafeMap, this.config.defaultZoomLevel,
                                        point);
            },

            renderLauncher: function renderLauncher() {
                if (!this.input)
                    this._initializeViews();
                return this.inputView.render().$el;
            },

            activate: function () {
                this.input.set('showingInput', true);
            },

            deactivate: function () {
                this.input.set('showingInput', false);
            },

            hibernate: function() {
                this.inputView.clear();
            }

        });
    }
);
