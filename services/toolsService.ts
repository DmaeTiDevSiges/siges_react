import { supabase } from './supabase';
import { Tool, UserTool, ToolMovement } from '../types';
import { getPublicImageUrl } from './imageUtils';

export const toolsService = {
  // ---------------------------------------------------------
  // CRUD de Ferramentas (tools)
  // ---------------------------------------------------------
  async getTools(): Promise<Tool[]> {
    const { data, error } = await supabase
      .from('tools')
      .select(`
        *,
        materials:material_id (code, description, unit)
      `)
      .eq('is_deleted', false)
      .order('brand', { ascending: true });

    if (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }
    return (data || []).map((item: any) => ({
      ...item,
      material_code: item.materials?.code,
      material_description: item.materials?.description,
      material_unit: item.materials?.unit
    }));
  },

  async checkSerialNumberExists(serialNumber: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('tools')
      .select('id')
      .eq('serial_number', serialNumber)
      .eq('is_deleted', false);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('Error checking serial number:', error);
      return false;
    }
    return !!data;
  },

  async checkCodeExists(code: string, excludeId?: number): Promise<boolean> {
    let query = supabase
      .from('tools')
      .select('id')
      .eq('code', code)
      .eq('is_deleted', false);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('Error checking code:', error);
      return false;
    }
    return !!data;
  },

  async createTool(tool: Partial<Tool>): Promise<Tool> {
    const { data, error } = await supabase
      .from('tools')
      .insert([tool])
      .select()
      .single();

    if (error) {
      console.error('Error creating tool:', error);
      throw error;
    }
    return data;
  },

  async updateTool(id: number, updates: Partial<Tool>, updatedUserId?: number): Promise<Tool> {
    const { data, error } = await supabase
      .from('tools')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_user_id: updatedUserId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tool:', error);
      throw error;
    }
    return data;
  },

  async deleteTool(id: number, deletedUserId?: number): Promise<void> {
    const { error } = await supabase
      .from('tools')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_user_id: deletedUserId
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting tool:', error);
      throw error;
    }
  },

  // ---------------------------------------------------------
  // Associações e Movimentações
  // ---------------------------------------------------------
  async getUserTools(userId?: number): Promise<UserTool[]> {
    let query = supabase
      .from('users_tools')
      .select(`
        *,
        tools:tool_id (code, brand, model, serial_number, materials:material_id (code, description, unit)),
        users:user_id (name_full, name_short, img_file_path, img_file_name)
      `)
      .order('date_start', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user tools:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item,
      user_name: item.users?.name_full || item.users?.name_short,
      user_avatar: getPublicImageUrl(item.users?.img_file_path, item.users?.img_file_name || 'noImageUser.png', { width: 70, height: 70, resize: 'cover' }),
      tool_code: item.tools?.code,
      tool_brand: item.tools?.brand,
      tool_model: item.tools?.model,
      tool_serial: item.tools?.serial_number,
      tool_material_code: item.tools?.materials?.code,
      tool_material_description: item.tools?.materials?.description,
      tool_material_unit: item.tools?.materials?.unit
    }));
  },

  async assignToolToUser(
    toolId: number,
    userId: number,
    amount: number = 1,
    createdUserId?: number
  ): Promise<void> {
    // 1. Insert into users_tools
    const { data: userTool, error: utError } = await supabase
      .from('users_tools')
      .insert([{
        user_id: userId,
        tool_id: toolId,
        amount: amount,
        status: 'USO',
        created_user_id: createdUserId
      }])
      .select()
      .single();

    if (utError) throw utError;

    // 2. Insert into movements
    const { error: movError } = await supabase
      .from('users_tools_movements')
      .insert([{
        tool_id: toolId,
        to_user_id: userId,
        movement_type: 'INCLUSAO',
        amount: amount,
        created_user_id: createdUserId
      }]);

    if (movError) throw movError;

    // 3. Update tool status
    await supabase
      .from('tools')
      .update({ status: 'EM_USO' })
      .eq('id', toolId);
  },

  async returnTool(
    userToolId: number,
    toolId: number,
    currentUserId: number,
    newToolStatus: 'DISPONIVEL' | 'MANUTENCAO',
    loggedUserId?: number
  ): Promise<void> {
    
    // 1. Update users_tools
    const { error: utError } = await supabase
      .from('users_tools')
      .update({
        status: 'BAIXADO',
        date_end: new Date().toISOString()
      })
      .eq('id', userToolId);

    if (utError) throw utError;

    // 2. Insert into movements
    const { error: movError } = await supabase
      .from('users_tools_movements')
      .insert([{
        tool_id: toolId,
        from_user_id: currentUserId,
        movement_type: 'BAIXA',
        amount: 1, 
        created_user_id: loggedUserId
      }]);

    if (movError) throw movError;

    // 3. Update tool status
    await supabase
      .from('tools')
      .update({ status: newToolStatus })
      .eq('id', toolId);
  },

  async transferTool(
    userToolId: number,
    toolId: number,
    fromUserId: number,
    toUserId: number,
    amount: number = 1,
    loggedUserId?: number
  ): Promise<void> {

    // 1. "Close" current user_tool link
    const { error: utCloseError } = await supabase
      .from('users_tools')
      .update({
        status: 'TRANSFERIDO',
        date_end: new Date().toISOString()
      })
      .eq('id', userToolId);

    if (utCloseError) throw utCloseError;

    // 2. Open new user_tool link
    const { error: utOpenError } = await supabase
      .from('users_tools')
      .insert([{
        user_id: toUserId,
        tool_id: toolId,
        amount: amount,
        status: 'USO',
        created_user_id: loggedUserId
      }]);

    if (utOpenError) throw utOpenError;

    // 3. Insert into movements
    const { error: movError } = await supabase
      .from('users_tools_movements')
      .insert([{
        tool_id: toolId,
        from_user_id: fromUserId,
        to_user_id: toUserId,
        movement_type: 'TRANSFERENCIA',
        amount: amount,
        created_user_id: loggedUserId
      }]);

    if (movError) throw movError;
  },

  async getToolMovements(toolId?: number): Promise<ToolMovement[]> {
    let query = supabase
      .from('users_tools_movements')
      .select(`
        *,
        tools:tool_id (code, brand, model, serial_number, materials:material_id (code, description, unit)),
        from_user:from_user_id (name_full, name_short, img_file_path, img_file_name),
        to_user:to_user_id (name_full, name_short, img_file_path, img_file_name)
      `)
      .order('created_at', { ascending: false });

    if (toolId) {
      query = query.eq('tool_id', toolId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tool movements:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      ...item,
      tool_code: item.tools?.code,
      tool_brand: item.tools?.brand,
      tool_model: item.tools?.model,
      tool_serial: item.tools?.serial_number,
      tool_material_code: item.tools?.materials?.code,
      tool_material_description: item.tools?.materials?.description,
      tool_material_unit: item.tools?.materials?.unit,
      from_user_name: item.from_user?.name_full || item.from_user?.name_short,
      from_user_avatar: getPublicImageUrl(item.from_user?.img_file_path, item.from_user?.img_file_name || 'noImageUser.png', { width: 70, height: 70, resize: 'cover' }),
      to_user_name: item.to_user?.name_full || item.to_user?.name_short,
      to_user_avatar: getPublicImageUrl(item.to_user?.img_file_path, item.to_user?.img_file_name || 'noImageUser.png', { width: 70, height: 70, resize: 'cover' })
    }));
  },

  async hasToolMovements(toolId: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('users_tools_movements')
      .select('id', { count: 'exact', head: true })
      .eq('tool_id', toolId);

    if (error) {
      console.error('Error checking tool movements:', error);
      return true;
    }
    return (count ?? 0) > 0;
  }
};
