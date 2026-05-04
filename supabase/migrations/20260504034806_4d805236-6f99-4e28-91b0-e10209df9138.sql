UPDATE public.ai_agent_config SET system_prompt = (SELECT system_prompt FROM public.ai_agent_config LIMIT 1);
-- placeholder; será substituído pelo conteúdo real abaixo
