// "layer_selector" plugin, main module

// Plugins should load their own versions of any libraries used even if those libraries are also used 
// by the GeositeFramework, in case a future framework version uses a different library version. 

require({
    // Specify library locations.
    // The calls to location.pathname.replace() below prepend the app's root path to the specified library location. 
    // Otherwise, since Dojo is loaded from a CDN, it will prepend the CDN server path and fail, as described in
    // https://dojotoolkit.org/documentation/tutorials/1.7/cdn
    packages: [
        {
            name: "jquery",
            location: "//ajax.googleapis.com/ajax/libs/jquery/1.9.0",
            main: "jquery.min"
        },
        {
            name: "underscore",
            location: "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4",
            main: "underscore-min"
        },
        {
            name: "extjs",
            location: "//cdn.sencha.io/ext-4.1.1-gpl",
            main: "ext-all"
        },
        {
            name: "jquery.placeholder",
            location: location.pathname.replace(/\/[^/]+$/, "") + "plugins/layer_selector/lib",
            main: "jquery.placeholder.amd.min"
        },
        {
            name: "tv4",
            location: location.pathname.replace(/\/[^/]+$/, "") + "plugins/layer_selector/lib",
            main: "tv4.min"
        }
    ]
});

define([
        "dojo/_base/declare",
        "framework/PluginBase",
        "./LayerManager",
        "./Ui",
        "dojo/text!plugins/layer_selector/layers.json",
        "dojo/text!plugins/layer_selector/templates.html",
        "jquery"
    ],
    function (declare, PluginBase, LayerManager, Ui, layerSourcesJson, templates, $) {

// Had trouble getting jquery-jsonp to load using AMD.
// Because jquery-jsonp is executed on jquery, rather
// than being "used" like another module they both
// need to be loaded using the same method. This is a
// workaround to execute the source of jquery-jsonp in a
// require block and modify jquery here.

// jquery.jsonp 2.4.0 (c)2012 Julian Aubourg | MIT License
// https://github.com/jaubourg/jquery-jsonp
(function(e){function t(){}function n(e){C=[e]}function r(e,t,n){return e&&e.apply&&e.apply(t.context||t,n)}function i(e){return/\?/.test(e)?"&":"?"}function O(c){function Y(e){z++||(W(),j&&(T[I]={s:[e]}),D&&(e=D.apply(c,[e])),r(O,c,[e,b,c]),r(_,c,[c,b]))}function Z(e){z++||(W(),j&&e!=w&&(T[I]=e),r(M,c,[c,e]),r(_,c,[c,e]))}c=e.extend({},k,c);var O=c.success,M=c.error,_=c.complete,D=c.dataFilter,P=c.callbackParameter,H=c.callback,B=c.cache,j=c.pageCache,F=c.charset,I=c.url,q=c.data,R=c.timeout,U,z=0,W=t,X,V,J,K,Q,G;return S&&S(function(e){e.done(O).fail(M),O=e.resolve,M=e.reject}).promise(c),c.abort=function(){!(z++)&&W()},r(c.beforeSend,c,[c])===!1||z?c:(I=I||u,q=q?typeof q=="string"?q:e.param(q,c.traditional):u,I+=q?i(I)+q:u,P&&(I+=i(I)+encodeURIComponent(P)+"=?"),!B&&!j&&(I+=i(I)+"_"+(new Date).getTime()+"="),I=I.replace(/=\?(&|$)/,"="+H+"$1"),j&&(U=T[I])?U.s?Y(U.s[0]):Z(U):(E[H]=n,K=e(y)[0],K.id=l+N++,F&&(K[o]=F),L&&L.version()<11.6?(Q=e(y)[0]).text="document.getElementById('"+K.id+"')."+p+"()":K[s]=s,A&&(K.htmlFor=K.id,K.event=h),K[d]=K[p]=K[v]=function(e){if(!K[m]||!/i/.test(K[m])){try{K[h]&&K[h]()}catch(t){}e=C,C=0,e?Y(e[0]):Z(a)}},K.src=I,W=function(e){G&&clearTimeout(G),K[v]=K[d]=K[p]=null,x[g](K),Q&&x[g](Q)},x[f](K,J=x.firstChild),Q&&x[f](Q,J),G=R>0&&setTimeout(function(){Z(w)},R)),c)}var s="async",o="charset",u="",a="error",f="insertBefore",l="_jqjsp",c="on",h=c+"click",p=c+a,d=c+"load",v=c+"readystatechange",m="readyState",g="removeChild",y="<script>",b="success",w="timeout",E=window,S=e.Deferred,x=e("head")[0]||document.documentElement,T={},N=0,C,k={callback:l,url:location.href},L=E.opera,A=!!e("<div>").html("<!--[if IE]><i><![endif]-->").find("i").length;O.setup=function(t){e.extend(k,t)},e.jsonp=O})($);

        return declare(PluginBase, {
            toolbarName: "Map Layers",
            fullName: "Configure and control layers to be overlayed on the base map.",
            toolbarType: "sidebar",
            allowIdentifyWhenActive: true,

            _layerManager: null,
            _ui: null,
            _currentState: {},

            initialize: function (frameworkParameters) {
                declare.safeMixin(this, frameworkParameters);
                this._layerManager = new LayerManager(this.app);
                this._ui = new Ui(this.container, this.map, templates);

                // Load layer sources, then render UI passing the tree of layer nodes
                var self = this;
                this._layerManager.load(layerSourcesJson, function (tree) {
                    if (self._currentState) {
                        self._layerManager.setServiceState(self._currentState, self.map);
                    }
                    self._ui.render(tree);
                    $('a.pluginLayerSelector-clear').click(function () { self.clearAll(); });
                });
            },

            activate: function () {
                if (this._currentState) {
                    this._layerManager.setServiceState(this._currentState, this.map);
                }
                this._ui.display();
            },

            deactivate: function () {
                this._ui.hideAll();
                this._currentState = this._layerManager.getServiceState();
            },

            hibernate: function () {
                this._currentState = this._layerManager.getServiceState();
                this._layerManager.hideAllLayers(this.map);
            },

            getState: function () {
                return this._layerManager.getServiceState();
            },

            setState: function (state) {
                this._currentState = state;
            },

            clearAll: function () {
                this._layerManager.hideAllLayers(this.map);
                this._ui.uncheckAndCollapse();
                this._currentState = {};
            }

        });
    }
);
