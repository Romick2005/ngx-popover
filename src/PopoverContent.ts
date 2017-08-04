import {Component, Input, AfterViewInit, ElementRef, ChangeDetectorRef, OnDestroy, ViewChild, EventEmitter, Renderer } from "@angular/core";
import {Popover} from "./Popover";

@Component({
    selector: "popover-content",
    template: `
<div #popoverDiv class="popover {{ effectivePlacement }} {{ currentPlacement }}"
     [ngStyle]="{'left': left + 'px', 'top': top + 'px', 'display': 'block'}"
     [class.in]="isIn"
     [class.fade]="animation">
    <div [hidden]="!closeOnMouseOutside" class="virtual-area"></div>
    <div class="arrow"
        [ngStyle]="{'left': arrowLeft + 'px', 'top': arrowTop + 'px'}">
    </div>
    <h3 class="popover-title" [hidden]="!title">{{ title }}</h3>
    <div class="popover-content">
        <ng-content></ng-content>
        {{ content }}
    </div>
</div>
`,
    styles: [`

.popover {
    margin-top: 0px;
}
.popover .virtual-area {
    height: 11px;
    width: 100%;
    position: absolute;
}
.popover.top .virtual-area {
    bottom: -11px;
}
.popover.bottom .virtual-area {
    top: -11px;
}
.popover.left .virtual-area {
    right: -11px;
}
.popover.right .virtual-area {
    left: -11px;
}

.popover.top-left>.arrow:after {
    top: -12px;
    margin-left: -10px;
}
.popover.top-center>.arrow:after {
    top: -12px;
    margin-left: -10px;
}
.popover.top-right>.arrow:after {
    top: -12px;
    margin-left: -10px;
}


.popover.center-left>.arrow:after {
    top: 1px;
    margin-left: -10px;
}
.popover.center-center>.arrow:after {
    top: 1px;
    margin-left: -10px;
}
.popover.center-right>.arrow:after {
    top: 1px;
    margin-left: -10px;
}


.popover.bottom-left>.arrow:after,
.popover.bottom-center>.arrow:after,
.popover.bottom-right>.arrow:after
 {
    content: " ";
    top: 1px;
    margin-left: -10px;
    border-top-width: 0;
    border-bottom-color: #fff;
}
`]
})
export class PopoverContent implements AfterViewInit, OnDestroy {

    // -------------------------------------------------------------------------
    // Inputs / Outputs
    // -------------------------------------------------------------------------

    // @Input()
    // hostElement: HTMLElement;

    @Input()
    content: string;

    @Input()
    placement: "top"|"bottom"|"left"|"right"|"auto"|"auto top"|"auto bottom"|"auto left"|"auto right" = "bottom";

    @Input()
    title: string;

    @Input()
    animation: boolean = true;

    @Input()
    closeOnClickOutside: boolean = false;

    @Input()
    closeOnMouseOutside: boolean = false;

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    @ViewChild("popoverDiv")
    popoverDiv: ElementRef;

    popover: Popover;
    onCloseFromOutside = new EventEmitter();
    top: number = -10000;
    left: number = -10000;
    arrowLeft: number = -10000;
    arrowTop: number = -10000;
    isIn: boolean = false;
    displayType: string = "none";
    effectivePlacement: string;
    currentPlacement: string;

    // -------------------------------------------------------------------------
    // Anonymous
    // -------------------------------------------------------------------------

    /**
     * Closes dropdown if user clicks outside of this directive.
     */
    onDocumentMouseDown = (event: any) => {
        const element = this.element.nativeElement;
        if (!element || !this.popover) return;
        if (element.contains(event.target) || this.popover.getElement().contains(event.target)) return;
        this.hide();
        this.onCloseFromOutside.emit(undefined);
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected element: ElementRef,
                protected cdr: ChangeDetectorRef,
                protected renderer: Renderer) {
    }

    // -------------------------------------------------------------------------
    // Lifecycle callbacks
    // -------------------------------------------------------------------------

    listenClickFunc: any;
    listenMouseFunc: any;
    ngAfterViewInit(): void {
        if (this.closeOnClickOutside)
            this.listenClickFunc = this.renderer.listenGlobal("document", "mousedown", (event: any) => this.onDocumentMouseDown(event));
        if (this.closeOnMouseOutside)
            this.listenMouseFunc = this.renderer.listenGlobal("document", "mouseover", (event: any) => this.onDocumentMouseDown(event));

        this.show();
        this.cdr.detectChanges();
    }

    ngOnDestroy() {
        if (this.closeOnClickOutside)
            this.listenClickFunc();
        if (this.closeOnMouseOutside)
            this.listenMouseFunc();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    show(): void {
        if (!this.popover || !this.popover.getElement())
            return;

        const p = this.positionElements(this.popover.getElement(), this.popoverDiv.nativeElement, this.placement);
        this.displayType = "block";
        this.top = p.top;
        this.left = p.left;
        this.arrowLeft = p.arrowLeft;
        this.arrowTop = p.arrowTop;
        this.isIn = true;
    }

    hide(): void {
        this.top = -10000;
        this.left = -10000;
        this.isIn = true;
        this.popover.hide();
    }

    hideFromPopover() {
        this.top = -10000;
        this.left = -10000;
        this.isIn = true;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected positionElements(hostEl: HTMLElement, targetEl: HTMLElement, positionStr: string, appendToBody: boolean = false): { top: number, left: number, arrowLeft: number, arrowTop: number } {
        let positionStrParts = positionStr.split("-");
        let posY = positionStrParts[0];
        let posX = positionStrParts[1] || "center";
        let hostElPos = appendToBody ? this.offset(hostEl) : this.position(hostEl);
        let targetElWidth = targetEl.offsetWidth;
        let targetElHeight = targetEl.offsetHeight;

        this.currentPlacement = positionStrParts.join("-");
        const popoverNativeEl = this.popoverDiv.nativeElement;
        const arrowNativeEl = popoverNativeEl.querySelector(".arrow");
        this.effectivePlacement = posY; // posX = this.getEffectivePlacement(posX, hostEl, targetEl);
        const arrowHeight = 11; // arrowNativeEl.offsetHeight / 2

        const getX = (): { left: number, arrowLeft: number } =>  {
            const arrowCenterX = hostElPos.width / 2 - arrowNativeEl.offsetWidth / 2;
            switch (posX) {
            case "left":
                return {
                    left: hostElPos.left,
                    arrowLeft: arrowCenterX
                };
            case "center":
                return {
                    left: hostElPos.left + hostElPos.width / 2 - targetElWidth / 2,
                    arrowLeft:  targetElWidth / 2
                };
            case "right":
                return {
                    left: hostElPos.left + hostElPos.width - targetElWidth,
                    arrowLeft: targetElWidth - hostElPos.width / 2
                };
            }
        };

        const getY = (): { top: number, arrowTop: number } => {
            const arrowCenterY = hostElPos.height / 2 - arrowNativeEl.offsetHeight / 2;
            switch (posY) {
            case "top":
                return {
                    top: hostElPos.top - targetElHeight - arrowHeight,
                    arrowTop: targetElHeight
                };
            case "center":
                return {
                    top: hostElPos.top + hostElPos.height / 2 - targetElHeight / 2,
                    arrowTop:  targetElHeight / 2
                };
            case "bottom":
                return {
                    top: hostElPos.top + hostElPos.height + arrowHeight,
                    arrowTop: -arrowHeight
                };
            }
        };
        let yData = getY();
        let xData = getX();
        return {
            top: yData.top,
            left: xData.left,
            arrowLeft: xData.arrowLeft,
            arrowTop: yData.arrowTop
        };

        /*switch (posX) {
        case "right":
        case "left":
            let yData = getY[posY]();
            return {
                top: yData.top,
                left: (posX === "right" ? getX[posX]() : hostElPos.left - targetElWidth),
                arrowLeft: 0,
                arrowTop: yData.arrowTop
            };
            break;
        case "bottom":
        case: "top":
            let xData = getY[posX]();
            return {
                top: ("bottom" ? getY[posX]() : hostElPos.top - targetElHeight),
                left: getX[posY](),
                arrowLeft: ,
                arrowTop:
            };
            break;*/
/*        default:
            throw new Error("[positionElements] Illegal position!");

        }
            return {
                top: top,
                left: left,
                arrowLeft: arrowLeft,
                arrowTop: arrowTop
            };*/
    }

    protected position(nativeEl: HTMLElement): { width: number, height: number, top: number, left: number } {
        let offsetParentBCR = { top: 0, left: 0 };
        const elBCR = this.offset(nativeEl);
        const offsetParentEl = this.parentOffsetEl(nativeEl);
        if (offsetParentEl !== window.document) {
            offsetParentBCR = this.offset(offsetParentEl);
            offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
            offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
        }

        const boundingClientRect = nativeEl.getBoundingClientRect();
        return {
            width: boundingClientRect.width || nativeEl.offsetWidth,
            height: boundingClientRect.height || nativeEl.offsetHeight,
            top: elBCR.top - offsetParentBCR.top,
            left: elBCR.left - offsetParentBCR.left
        };
    }

    protected offset(nativeEl: any): { width: number, height: number, top: number, left: number } {
        const boundingClientRect = nativeEl.getBoundingClientRect();
        return {
            width: boundingClientRect.width || nativeEl.offsetWidth,
            height: boundingClientRect.height || nativeEl.offsetHeight,
            top: boundingClientRect.top + (window.pageYOffset || window.document.documentElement.scrollTop),
            left: boundingClientRect.left + (window.pageXOffset || window.document.documentElement.scrollLeft)
        };
    }

    protected getStyle(nativeEl: HTMLElement, cssProp: string): string {
        if ((nativeEl as any).currentStyle) // IE
            return (nativeEl as any).currentStyle[cssProp];

        if (window.getComputedStyle)
            return (window.getComputedStyle as any)(nativeEl)[cssProp];

        // finally try and get inline style
        return (nativeEl.style as any)[cssProp];
    }

    protected isStaticPositioned(nativeEl: HTMLElement): boolean {
        return (this.getStyle(nativeEl, "position") || "static" ) === "static";
    }

    protected parentOffsetEl(nativeEl: HTMLElement): any {
        let offsetParent: any = nativeEl.offsetParent || window.document;
        while (offsetParent && offsetParent !== window.document && this.isStaticPositioned(offsetParent)) {
            offsetParent = offsetParent.offsetParent;
        }
        return offsetParent || window.document;
    }

    protected getEffectivePlacement(placement: string, hostElement: HTMLElement, targetElement: HTMLElement): string {
        const placementParts = placement.split(" ");
        if (placementParts[0] !== "auto") {
            return placement;
        }

        const hostElBoundingRect = hostElement.getBoundingClientRect();

        const desiredPlacement = placementParts[1] || "bottom";

        if (desiredPlacement === "top" && hostElBoundingRect.top - targetElement.offsetHeight < 0) {
            return "bottom";
        }
        if (desiredPlacement === "bottom" && hostElBoundingRect.bottom + targetElement.offsetHeight > window.innerHeight) {
            return "top";
        }
        if (desiredPlacement === "left" && hostElBoundingRect.left - targetElement.offsetWidth < 0) {
            return "right";
        }
        if (desiredPlacement === "right" && hostElBoundingRect.right + targetElement.offsetWidth > window.innerWidth) {
            return "left";
        }

        return desiredPlacement;
    }
}
