(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/PdfViewer.tsx [app-client] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_9103f00b._.js",
  "static/chunks/components_PdfViewer_tsx_eb72abe3._.js",
  {
    "path": "static/chunks/node_modules_react-pdf_dist_Page_68a5a099._.css",
    "included": [
      "[project]/node_modules/react-pdf/dist/Page/AnnotationLayer.css [app-client] (css)",
      "[project]/node_modules/react-pdf/dist/Page/TextLayer.css [app-client] (css)"
    ],
    "moduleChunks": [
      "static/chunks/node_modules_react-pdf_dist_Page_AnnotationLayer_css_bad6b30c._.single.css",
      "static/chunks/node_modules_react-pdf_dist_Page_TextLayer_css_bad6b30c._.single.css"
    ]
  },
  "static/chunks/components_PdfViewer_tsx_875fbf97._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/components/PdfViewer.tsx [app-client] (ecmascript, next/dynamic entry)");
    });
});
}),
"[project]/node_modules/react-reader/dist/react-reader.es.js [app-client] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_es5-ext_c5464ecd._.js",
  "static/chunks/node_modules_@xmldom_xmldom_lib_f6488e4b._.js",
  "static/chunks/node_modules_epubjs_src_30f0a612._.js",
  "static/chunks/node_modules_jszip_dist_jszip_0b628ba4.js",
  "static/chunks/node_modules_localforage_dist_localforage_1621cf16.js",
  "static/chunks/node_modules_97bee433._.js",
  "static/chunks/node_modules_react-reader_dist_react-reader_es_875fbf97.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/react-reader/dist/react-reader.es.js [app-client] (ecmascript, next/dynamic entry)");
    });
});
}),
]);