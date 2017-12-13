import { IJSXServeHandlerObject } from './types';

export module JSXServeServerTools {

    /**
     * creates a filter function to filter all views that are registered at
     * the url
     * @param {string[]} urlPathArray list of url sections (split by /)
     */
    export const matchViewToPath = function (urlPathArray: string[]) {
        return function (handler: IJSXServeHandlerObject) {
            const handlerHasMatchingPathLengths = urlPathArray.length === handler.path.length;

            // find matching path section -> possibly heavy as long
            // paths could be filtered, thus in an own function
            // which is only being invoked when handlerHasMatchingPathLengths
            // is evaluated as true
            const findMatchingPathSections = function () {
                return urlPathArray.filter(function (currentPathSection, index) {
                    handler.path[index] === currentPathSection;
                });
            };

            return handlerHasMatchingPathLengths && findMatchingPathSections()
                .length === urlPathArray.length;
        }
    };
}