export const skills = [
    {
        id: 'lean', name: 'lean', kind: 'development discipline', projectCode: '010',
        sub: 'contracts first. independent verification.',
        body: 'shape the task, make the contract explicit, build against it, and have an independent agent check the result. failed gates send the work back to the phase that owns the problem.',
        useWhen: 'you want a development method that lives in the skill file and the code contracts.',
        url: 'https://github.com/AnEntrypoint/lean',
        href: 'https://github.com/AnEntrypoint/lean/blob/main/skills/lean/SKILL.md', action: 'read the skill'
    },
    {
        id: 'dada', name: 'dada', kind: 'design skill',
        sub: 'ambitious graphic design, challenged by independent critics.',
        body: 'a design brief becomes a living frontier of typography, identity, imagery, layout, and motion decisions. rival directions and independent critics push the work until the whole design holds together.',
        useWhen: 'a poster, identity, editorial piece, or interface needs a design process with teeth.',
        url: 'https://github.com/AnEntrypoint/dada',
        href: 'https://github.com/AnEntrypoint/dada/blob/main/skills/dada/SKILL.md', action: 'read the skill'
    },
    {
        id: 'engage', name: 'engage', kind: 'workflow discipline',
        sub: 'a nonlinear graph for taking work from framing to delivery.',
        body: 'orientation, framing, architecture, design, building, verification, operations, and communication share one graph. memory carries context across passes; recovery edges return to the earliest phase that can fix a failure.',
        useWhen: 'the task crosses disciplines and a straight checklist keeps losing the plot.',
        url: 'https://github.com/AnEntrypoint/engage',
        href: 'https://github.com/AnEntrypoint/engage/blob/main/skills/engage/SKILL.md', action: 'read the skill'
    },
    {
        id: 'gm', name: 'gm', kind: 'orchestration discipline', projectCode: '001',
        sub: 'a state machine with gates on the work.',
        body: 'gm puts explicit phases, tracked obligations, and checked transitions inside the agent loop. a failed gate names the recovery step. the skill runs on agentplug and can be reached through MCP.',
        useWhen: 'an agent needs to track the work, verify it, and keep going until the completion gates hold.',
        url: 'https://github.com/AnEntrypoint/gm',
        href: 'https://github.com/AnEntrypoint/gm/blob/main/skills/gm/SKILL.md', action: 'read the skill'
    },
    {
        id: 'faiku', name: 'faiku', kind: 'audit prompt',
        sub: 'check the state. challenge the derivation.',
        body: 'a copyable prompt that asks the agent to check contradictions, name missing evidence, try to falsify its own derivation, and return structured output.',
        useWhen: 'you want an evidence check on a bounded question before trusting the answer.',
        url: 'https://github.com/AnEntrypoint/faiku',
        href: 'https://anentrypoint.github.io/faiku/', action: 'get the prompt'
    },
    {
        id: 'pimpmyskill', name: 'pimpmyskill', kind: 'skill authoring prompt',
        sub: 'turn a workflow into anchors, a graph, and a skill.',
        body: 'a copyable prompt for expressing a workflow through established techniques and their authors, connecting them in a nonlinear Mermaid graph, and turning the result into a skill file.',
        useWhen: 'you have a working method and want to make its reasoning and return paths explicit.',
        url: 'https://github.com/AnEntrypoint/pimpmyskill',
        href: 'https://anentrypoint.github.io/pimpmyskill/', action: 'get the prompt'
    }
];

export const disciplineProjectCodes = new Set(skills.flatMap(skill => skill.projectCode ? [skill.projectCode] : []));
