import { Stage } from "./Stage";
import { useEffect, useState } from "react";
import { DEFAULT_INITIAL, StageBase, InitialData } from "@chub-ai/stages-ts";
import { TEST_SAVE } from './data/testPersona';

// Modify this JSON to include whatever character/user information you want to test.
import InitData from './assets/test-init.json';

export interface TestStageRunnerProps<StageType extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType>, InitStateType, ChatStateType, MessageStateType, ConfigType> {
    factory: (data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) => StageType;
}

/***
 This is a testing class for running a stage locally when testing,
    outside the context of an active chat. See runTests() below for the main idea.
 ***/
export const TestStageRunner = <StageType extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType>,
    InitStateType, ChatStateType, MessageStateType, ConfigType>({ factory }: TestStageRunnerProps<StageType, InitStateType, ChatStateType, MessageStateType, ConfigType>) => {

    // @ts-ignore
    const [stage, _setStage] = useState(new Stage({
        ...DEFAULT_INITIAL,
        ...InitData,
        // DEFAULT_INITIAL.userId is "1" but test-init.json users are keyed at "0".
        // Override so the Stage constructor can resolve the test user.
        userId: "0",
        // chatState options:
        //   { save: null }      → full first-time experience (splash → setup → Umbri intro)
        //   { save: TEST_SAVE } → skip onboarding, land in game view (map enabled)
        chatState: { save: null },
    }));

    // This is what forces the stage node to re-render.
    const [node, setNode] = useState(new Date());

    function refresh() {
        setNode(new Date());
    }

    async function runTests() {
        // Prompt injection testing happens via the chat UI now:
        // type any message in the input and the stage directions block
        // will appear inline in the log. No manual test calls needed here.
    }

    useEffect(() => {
        // Always do this first, and put any other calls inside the load response.
        stage.load().then((res) => {
            console.info(`Test StageBase Runner load success result was ${res.success}`);
            if (!res.success || res.error != null) {
                console.error(`Error from stage during load, error: ${res.error}`);
            } else {
                runTests().then(() => console.info("Done running tests."));
            }
        });
    }, []);

    return <>
        <div style={{ display: 'none' }}>{String(node)}{window.location.href}</div>
        {stage == null ? <div>Stage loading...</div> : stage.render()}
    </>;
}
